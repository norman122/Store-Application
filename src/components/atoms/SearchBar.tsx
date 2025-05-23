import React from 'react';
import {
  TextInput,
  View,
  StyleSheet,
  TextInputProps,
  Platform,
  ViewStyle,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';

interface SearchBarProps extends TextInputProps {
  icon?: React.ReactNode;
  style?: ViewStyle;
}

const SearchBar: React.FC<SearchBarProps> = ({
  icon,
  style,
  ...props
}) => {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.cardBackground, borderColor: theme.border },
        style,
      ]}
    >
      {icon && <View style={styles.iconContainer}>{icon}</View>}
      <TextInput
        {...props}
        style={[styles.input, { color: theme.text }]}
        placeholderTextColor={theme.secondary}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    height: 44,
    paddingHorizontal: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  iconContainer: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    padding: 0,
  },
});

export default SearchBar; 