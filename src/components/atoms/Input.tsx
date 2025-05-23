import React from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TextInputProps,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { Controller, Control, FieldValues, FieldPath } from 'react-hook-form';
import { useTheme } from '../../context/ThemeContext';

interface InputProps<T extends FieldValues> extends TextInputProps {
  label?: string;
  control: Control<T>;
  name: FieldPath<T>;
  error?: string;
  containerStyle?: StyleProp<ViewStyle>;
  valueAsNumber?: boolean;
}

function Input<T extends FieldValues>({
  label,
  control,
  name,
  error,
  containerStyle,
  valueAsNumber = false,
  ...rest
}: InputProps<T>) {
  const { theme, isDarkMode } = useTheme();

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={[styles.label, { color: theme.text }]}>{label}</Text>}
      <Controller
        control={control}
        name={name}
        render={({ field: { value, onChange, onBlur } }) => (
          <TextInput
            style={[
              styles.input,
              { 
                color: theme.text, 
                borderColor: error ? 'red' : theme.border,
                backgroundColor: theme.cardBackground
              },
            ]}
            value={value?.toString() || ''}
            onChangeText={(text) => {
              if (valueAsNumber) {
                // Convert to number for number fields
                onChange(text === '' ? 0 : parseFloat(text));
              } else {
                onChange(text);
              }
            }}
            onBlur={onBlur}
            placeholderTextColor={isDarkMode ? '#888' : '#AAA'}
            {...rest}
          />
        )}
      />
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    width: '100%',
  },
  label: {
    marginBottom: 8,
    fontSize: 16,
    fontWeight: '500',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  error: {
    color: 'red',
    fontSize: 12,
    marginTop: 4,
  },
});

export default Input; 