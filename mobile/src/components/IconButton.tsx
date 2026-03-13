/**
 * IconButton — rounded touchable icon with ripple.
 */

import React from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { colors, borderRadius } from '../theme';

interface IconButtonProps {
  name: string;
  size?: number;
  color?: string;
  onPress?: () => void;
  style?: ViewStyle;
  backgroundColor?: string;
}

const IconButton: React.FC<IconButtonProps> = ({
  name,
  size = 22,
  color = colors.text,
  onPress,
  style,
  backgroundColor,
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[
        styles.container,
        backgroundColor ? { backgroundColor } : undefined,
        style,
      ]}
    >
      <Icon name={name} size={size} color={color} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default IconButton;
