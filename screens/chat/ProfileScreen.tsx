import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ArrowLeft, Image as ImageIcon, Trash2 } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";

import UserAvatar from "@/components/UserAvatar";
import { useAuth } from "@/contexts/AuthContext";
import {
  deleteAvatar,
  updateProfile,
  type UploadableImage,
} from "@/services/UserService";
import type { RootStackParamList } from "@/types/navigation";
import type { User } from "@/types";

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "Profile">;

export default function ProfileScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { user, setUser, refreshUser } = useAuth();

  const [name, setName] = useState(user?.name ?? "");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<UploadableImage | null>(
    null,
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setName(user?.name ?? "");
    setSelectedImage(null);
    setAvatarPreview(null);
  }, [user?.id, user?.name]);

  const nameError = useMemo(() => {
    const trimmed = name.trim();
    if (trimmed === (user?.name ?? "")) return null;
    if (trimmed.length < 3) return "Name must be at least 3 characters.";
    if (trimmed.length > 32) return "Name is too long.";
    return null;
  }, [name, user?.name]);

  const isDirty = useMemo(() => {
    const trimmed = name.trim();
    return trimmed !== (user?.name ?? "") || !!selectedImage;
  }, [name, selectedImage, user?.name]);

  const canSave = isDirty && !nameError && !isSaving;

  const withCacheBust = (avatar: User["avatar"]) => {
    if (!avatar) return null;
    const ts = Date.now();
    const append = (url: string) =>
      url.includes("?") ? `${url}&t=${ts}` : `${url}?t=${ts}`;
    return {
      original: append(avatar.original),
      medium: append(avatar.medium),
      small: append(avatar.small),
    };
  };

  const pickImage = async () => {
    setError(null);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        "Permission needed",
        "Please allow photo library access to change your avatar.",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return;
    }

    const asset = result.assets[0];
    setSelectedImage({
      uri: asset.uri,
      name: asset.fileName ?? `avatar-${Date.now()}.jpg`,
      type: asset.mimeType ?? "image/jpeg",
    });
    setAvatarPreview(asset.uri);
  };

  const handleDeleteAvatar = async () => {
    if (!user?.avatar || isDeleting) return;
    setError(null);
    setIsDeleting(true);

    const res = await deleteAvatar(String(user.id));
    if (res.success) {
      setUser((prev) => (prev ? { ...prev, avatar: null } : prev));
      setAvatarPreview(null);
      setSelectedImage(null);
    } else {
      setError("Could not delete avatar. Please try again.");
    }

    setIsDeleting(false);
  };

  const handleSave = async () => {
    if (!user || !canSave) return;
    const trimmedName = name.trim();
    const nameChanged = trimmedName !== user.name;
    const avatarChanged = !!selectedImage;

    setIsSaving(true);
    setError(null);

    const res = await updateProfile(String(user.id), {
      name: nameChanged ? trimmedName : undefined,
      avatar: selectedImage ?? undefined,
    });

    if (!res.success) {
      setError("Failed to update profile. Please try again.");
      setIsSaving(false);
      return;
    }

    try {
      const latest = await refreshUser();
      const avatarWithBust =
        avatarChanged && latest.avatar
          ? withCacheBust(latest.avatar)
          : latest.avatar;

      setUser({ ...latest, avatar: avatarWithBust });
      setSelectedImage(null);
      setAvatarPreview(null);
      navigation.goBack();
    } catch (refreshError) {
      setError("Profile updated, but we could not refresh your info.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          activeOpacity={0.8}
        >
          <ArrowLeft size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Avatar</Text>
          <UserAvatar
            uri={avatarPreview ?? user.avatar?.medium ?? user.avatar?.small}
            name={user.name}
            size={96}
            style={styles.avatar}
          />

          <View style={styles.avatarActions}>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={pickImage}
              activeOpacity={0.85}
              disabled={isSaving}
            >
              <ImageIcon size={18} color="#1e293b" />
              <Text style={styles.secondaryButtonText}>Change photo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.dangerButton,
                (!user.avatar || isDeleting || isSaving) &&
                  styles.disabledButton,
              ]}
              onPress={handleDeleteAvatar}
              activeOpacity={0.85}
              disabled={!user.avatar || isDeleting || isSaving}
            >
              {isDeleting ? (
                <ActivityIndicator size="small" color="#ef4444" />
              ) : (
                <Trash2 size={18} color="#ef4444" />
              )}
              <Text style={styles.dangerButtonText}>Remove</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Name</Text>
          <TextInput
            style={[
              styles.input,
              nameError ? styles.inputError : undefined,
              isSaving && styles.inputDisabled,
            ]}
            value={name}
            onChangeText={setName}
            placeholder="Enter your display name"
            placeholderTextColor="#94a3b8"
            editable={!isSaving}
          />
          {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}
          <View style={styles.helperRow}>
            <Text style={styles.helperText}>@{user.tag}</Text>
            <Text style={styles.helperText}>{user.email}</Text>
          </View>
        </View>

        {error ? <Text style={styles.errorBanner}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.primaryButton, !canSave && styles.disabledButton]}
          activeOpacity={0.9}
          onPress={handleSave}
          disabled={!canSave}
        >
          {isSaving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryButtonText}>Save changes</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  backBtn: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1e293b",
  },
  content: {
    padding: 20,
    gap: 16,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 12,
  },
  avatar: {
    alignSelf: "center",
    marginBottom: 12,
  },
  avatarActions: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
  },
  input: {
    backgroundColor: "#f8fafc",
    height: 50,
    borderWidth: 1,
    borderRadius: 12,
    borderColor: "#e2e8f0",
    paddingHorizontal: 14,
    fontSize: 16,
    color: "#1e293b",
  },
  inputDisabled: {
    opacity: 0.7,
  },
  inputError: {
    borderColor: "#ef4444",
    backgroundColor: "#fef2f2",
  },
  helperRow: {
    marginTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  helperText: {
    color: "#94a3b8",
    fontSize: 13,
    fontWeight: "600",
  },
  primaryButton: {
    backgroundColor: "#667eea",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#667eea",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#e2e8f0",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  secondaryButtonText: {
    color: "#1e293b",
    fontSize: 14,
    fontWeight: "700",
  },
  dangerButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#fef2f2",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  dangerButtonText: {
    color: "#ef4444",
    fontSize: 14,
    fontWeight: "700",
  },
  disabledButton: {
    opacity: 0.6,
  },
  errorBanner: {
    backgroundColor: "#fef2f2",
    borderColor: "#fecdd3",
    borderWidth: 1,
    color: "#b91c1c",
    padding: 12,
    borderRadius: 10,
    fontWeight: "700",
  },
  errorText: {
    color: "#ef4444",
    marginTop: 8,
    fontSize: 13,
    fontWeight: "600",
  },
});
