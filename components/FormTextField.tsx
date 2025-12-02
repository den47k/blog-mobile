import {
  View,
  Text,
  StyleSheet,
  TextInput,
  type TextInputProps,
} from "react-native";

interface FormTextFieldProps extends TextInputProps {
  label: string;
  errors: string[];
}

export default function FormTextField({
  label,
  errors = [],
  ...rest
}: FormTextFieldProps) {
  return (
    <View>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[styles.textInput, errors.length > 0 && styles.textInputError]}
        autoCapitalize="none"
        placeholderTextColor="#94a3b8"
        {...rest}
      />
      {errors.map((err) => {
        return (
          <Text key={err} style={styles.error}>
            {err}
          </Text>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    color: "#475569",
    fontWeight: "600",
    fontSize: 14,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: "#f8fafc",
    height: 48,
    borderWidth: 1,
    borderRadius: 10,
    borderColor: "#e2e8f0",
    paddingHorizontal: 16,
    fontSize: 15,
    color: "#1e293b",
  },
  textInputError: {
    borderColor: "#ef4444",
    backgroundColor: "#fef2f2",
  },
  error: {
    color: "#ef4444",
    marginTop: 6,
    fontSize: 13,
  },
});
