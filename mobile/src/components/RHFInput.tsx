import React from "react";
import { Controller, Control, FieldValues, Path } from "react-hook-form";
import { Text, TextInput, View, TextInputProps } from "react-native";

type RHFInputProps<T extends FieldValues> = {
  control: Control<T>;
  name: Path<T>;
  label?: string;
} & Pick<
  TextInputProps,
  | "placeholder"
  | "keyboardType"
  | "secureTextEntry"
  | "autoCapitalize"
  | "autoCorrect"
  | "textContentType"
  | "autoComplete"
  | "returnKeyType"
  | "onSubmitEditing"
>;

export default function RHFInput<T extends FieldValues>({
  control,
  name,
  label,
  ...inputProps
}: RHFInputProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { value, onChange, onBlur }, fieldState: { error } }) => (
        <View style={{ gap: 6 }}>
          {!!label && <Text style={{ fontWeight: "700" }}>{label}</Text>}

          <TextInput
            value={(value ?? "") as string}
            onChangeText={onChange}
            onBlur={onBlur}
            style={{
              borderWidth: 1,
              borderColor: error ? "crimson" : "#BFC7D1",
              borderRadius: 10,
              paddingHorizontal: 12,
              paddingVertical: 10,
              backgroundColor: "white",
            }}
            {...inputProps}
          />

          {!!error?.message && (
            <Text style={{ color: "crimson" }}>{String(error.message)}</Text>
          )}
        </View>
      )}
    />
  );
}