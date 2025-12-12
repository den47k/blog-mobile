import React, { memo, useEffect, useMemo, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { getToken } from "@/services/TokenService";

type Props = {
  uri?: string | null;
  name?: string | null;
  size?: number;
  style?: StyleProp<ViewStyle>;
  badgeColor?: string;
};

const gradients: [string, string][] = [
  ["#667eea", "#764ba2"],
  ["#4facfe", "#00f2fe"],
  ["#fa709a", "#fee140"],
  ["#f093fb", "#f5576c"],
  ["#43e97b", "#38f9d7"],
];

function initialsFromName(name?: string | null) {
  if (!name) return "";
  const parts = name
    .split(" ")
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length === 0) return name[0]?.toUpperCase() ?? "";
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? "";
  return `${parts[0][0]?.toUpperCase() ?? ""}${parts[1][0]?.toUpperCase() ?? ""}`;
}

function UserAvatar({ uri, name, size = 48, style, badgeColor }: Props) {
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [isTokenReady, setIsTokenReady] = useState(false);
  const [failed, setFailed] = useState(false);

  const imageSource = useMemo(
    () =>
      uri && authToken
        ? {
            uri,
            headers: { Authorization: `Bearer ${authToken}` },
          }
        : null,
    [authToken, uri],
  );

  const showImage = !!imageSource && isTokenReady && !failed;

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const token = await getToken();
        if (isMounted) {
          setAuthToken(token);
        }
      } catch (error) {
        console.error("Failed to load auth token for avatar", error);
        if (isMounted) {
          setAuthToken(null);
        }
      } finally {
        if (isMounted) {
          setIsTokenReady(true);
        }
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    setFailed(false);
  }, [imageSource]);

  const gradient = useMemo(() => {
    const index =
      name && name.length > 0 ? name.charCodeAt(0) % gradients.length : 0;
    return gradients[index];
  }, [name]);

  const initials = useMemo(() => initialsFromName(name), [name]);

  const badgeSize = Math.max(8, size * 0.22);

  return (
    <View
      style={[
        styles.wrapper,
        { width: size, height: size, borderRadius: size / 2 },
        style,
      ]}
    >
      {showImage ? (
        <Image
          source={imageSource!}
          cachePolicy="memory-disk"
          style={[
            styles.image,
            { width: size, height: size, borderRadius: size / 2 },
          ]}
          contentFit="cover"
          transition={200}
          onError={() => setFailed(true)}
        />
      ) : (
        <LinearGradient
          colors={gradient}
          style={[
            styles.fallback,
            { width: size, height: size, borderRadius: size / 2 },
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.initials}>{initials}</Text>
        </LinearGradient>
      )}
      {badgeColor ? (
        <View
          style={[
            styles.badge,
            {
              backgroundColor: badgeColor,
              borderRadius: badgeSize / 2,
              width: badgeSize,
              height: badgeSize,
              right: Math.max(2, size * 0.08),
              top: Math.max(2, size * 0.08),
            },
          ]}
        />
      ) : null}
    </View>
  );
}

export default memo(UserAvatar);

const styles = StyleSheet.create({
  wrapper: {
    overflow: "hidden",
    position: "relative",
  },
  image: {},
  fallback: {
    alignItems: "center",
    justifyContent: "center",
  },
  initials: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  badge: {
    position: "absolute",
    borderWidth: 2,
    borderColor: "#fff",
  },
});
