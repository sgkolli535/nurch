import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../ui/Text';
import { Badge } from '../ui/Badge';
import { colors } from '../../theme/colors';
import { spacing, borderRadius } from '../../theme/spacing';
import { shadows } from '../../theme/shadows';

interface GardenToolbarProps {
  gardenName: string;
  hardinessZone?: string | null;
  plantCount: number;
  isEditMode: boolean;
  onToggleEdit: () => void;
  onAddPlant: () => void;
  onAddZone: () => void;
}

export function GardenToolbar({
  gardenName,
  hardinessZone,
  plantCount,
  isEditMode,
  onToggleEdit,
  onAddPlant,
  onAddZone,
}: GardenToolbarProps) {
  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <View>
          <Text variant="heading2" color={colors.soil}>{gardenName}</Text>
          <View style={styles.metaRow}>
            {hardinessZone && (
              <Badge label={`Zone ${hardinessZone}`} color={colors.forest} backgroundColor={colors.sage + '30'} />
            )}
            <Text variant="caption" color={colors.bark}>
              {plantCount} {plantCount === 1 ? 'plant' : 'plants'}
            </Text>
          </View>
        </View>
      </View>
      <View style={styles.actions}>
        <ToolbarButton label={isEditMode ? 'Done' : 'Edit'} onPress={onToggleEdit} active={isEditMode} />
        <ToolbarButton label="+ Plant" onPress={onAddPlant} />
        <ToolbarButton label="+ Zone" onPress={onAddZone} />
      </View>
    </View>
  );
}

function ToolbarButton({
  label,
  onPress,
  active = false,
}: {
  label: string;
  onPress: () => void;
  active?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        active && styles.buttonActive,
        pressed && { opacity: 0.8 },
      ]}
    >
      <Text
        variant="caption"
        color={active ? colors.cream : colors.forest}
        style={styles.buttonLabel}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.cream,
    borderBottomWidth: 1,
    borderBottomColor: colors.parchment,
    ...shadows.rest,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  button: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.parchment,
  },
  buttonActive: {
    backgroundColor: colors.sage,
  },
  buttonLabel: {
    fontWeight: '600',
  },
});
