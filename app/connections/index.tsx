import { useCallback, useEffect, useMemo, useState } from 'react'
import { FlatList, Pressable, RefreshControl, StyleSheet, TextInput, View } from 'react-native'
import { useRouter } from 'expo-router'
import { ScreenHeader } from '@/components/ScreenHeader'
import { Text } from '@/components/Text'
import { Avatar } from '@/components/Avatar'
import { Card } from '@/components/Card'
import { EmptyState } from '@/components/EmptyState'
import { LoadingScreen } from '@/components/Skeleton'
import { connectionService } from '@/services/connectionService'
import { timeAgo } from '@/utils/format'
import { useAppTheme } from '@/hooks/useAppTheme'
import { ScannedContact } from '@/types'
import { radius, spacing } from '@/theme'

type Filter = 'all' | 'offline' | 'whatsapp' | 'profile' | 'tagged'

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'offline', label: 'Offline' },
  { key: 'whatsapp', label: 'WhatsApp' },
  { key: 'profile', label: 'Profile' },
  { key: 'tagged', label: 'Tagged' },
]

export default function ConnectionsScreen() {
  const router = useRouter()
  const { colors } = useAppTheme()
  const [contacts, setContacts] = useState<ScannedContact[] | null>(null)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    const data = await connectionService.getRecentConnections()
    return data
  }, [])

  useEffect(() => {
    let active = true
    void load().then((data) => {
      if (active) setContacts(data)
    })
    return () => {
      active = false
    }
  }, [load])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await load()
      .then((data) => setContacts(data))
      .catch(() => {})
    setRefreshing(false)
  }, [load])

  const filtered = useMemo(() => {
    const all = contacts ?? []
    const q = query.trim().toLowerCase()
    return all.filter((c) => {
      if (filter === 'tagged' && !(c.tags && c.tags.length > 0)) return false
      if (filter !== 'all' && filter !== 'tagged' && c.type !== filter) return false
      if (!q) return true
      return (
        c.name.toLowerCase().includes(q) ||
        (c.phone ?? '').includes(q) ||
        (c.email ?? '').toLowerCase().includes(q) ||
        (c.company ?? '').toLowerCase().includes(q)
      )
    })
  }, [contacts, filter, query])

  // Group by tag when the tagged filter is active, otherwise by connection type.
  const sections = useMemo(() => {
    const groups = new Map<string, ScannedContact[]>()
    for (const c of filtered) {
      const key =
        filter === 'tagged'
          ? (c.tags ?? []).join(', ')
          : c.type === 'offline'
            ? 'Offline Connect'
            : c.type === 'whatsapp'
              ? 'WhatsApp'
              : c.type === 'profile'
                ? 'ConnectQR profiles'
                : 'Other'
      const list = groups.get(key) ?? []
      list.push(c)
      groups.set(key, list)
    }
    return [...groups.entries()]
  }, [filtered, filter])

  return (
    <View style={[styles.fill, { backgroundColor: colors.background }]}>
      <ScreenHeader
        title="Connections"
        subtitle={`${contacts?.length ?? 0} saved`}
        onBack={() => router.back()}
      />
      <FlatList
        data={sections}
        keyExtractor={([key]) => key}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={[styles.search, { backgroundColor: colors.surfaceSecondary }]}>
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search name, phone, email…"
                placeholderTextColor={colors.textMuted}
                style={[styles.searchInput, { color: colors.textPrimary }]}
                autoCorrect={false}
                returnKeyType="search"
              />
            </View>
            <View style={styles.chips}>
              {FILTERS.map((f) => (
                <Chip
                  key={f.key}
                  label={f.label}
                  active={filter === f.key}
                  onPress={() => setFilter(f.key)}
                />
              ))}
            </View>
          </View>
        }
        renderItem={({ item: [group, items] }) => (
          <View style={styles.group}>
            <Text variant="label" color="secondary" style={styles.groupTitle}>
              {`${group.toUpperCase()} · ${items.length}`}
            </Text>
            <Card padded={false}>
              {items.map((c, i) => (
                <View
                  key={c.id}
                  style={[styles.row, i === items.length - 1 ? null : styles.divider]}
                >
                  <Avatar name={c.name} uri={c.avatar} size={40} />
                  <View style={styles.rowText}>
                    <Text variant="body" numberOfLines={1}>
                      {c.name}
                    </Text>
                    <Text variant="caption" color="muted" numberOfLines={1}>
                      {subtitleFor(c)}
                    </Text>
                  </View>
                </View>
              ))}
            </Card>
          </View>
        )}
        ListEmptyComponent={
          contacts === null ? (
            <LoadingScreen />
          ) : (
            <EmptyState
              icon="people-outline"
              title="No connections found"
              message={
                query
                  ? `Nothing matches "${query}". Try a different search or filter.`
                  : 'Scan a ConnectQR code to start building your network.'
              }
              actionLabel={query ? undefined : 'Scan a QR'}
              onAction={query ? undefined : () => router.push('/scan')}
            />
          )
        }
      />
    </View>
  )
}

function subtitleFor(c: ScannedContact): string {
  const parts: string[] = []
  if (c.title) parts.push(c.title)
  parts.push(timeAgo(c.scannedAt))
  if (c.tags && c.tags.length) parts.push(c.tags.join(' · '))
  return parts.join(' · ')
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const { colors } = useAppTheme()
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: active ? colors.primary : colors.surfaceSecondary,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <Text variant="caption" color={active ? 'inverse' : 'secondary'}>
        {label}
      </Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  list: { paddingHorizontal: spacing.xl, paddingBottom: spacing['4xl'] },
  header: { gap: spacing.md, marginBottom: spacing.lg },
  search: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radius.md },
  searchInput: { fontSize: 15, paddingVertical: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.full },
  group: { marginBottom: spacing.xl },
  groupTitle: { marginBottom: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  rowText: { flex: 1, gap: 2 },
  divider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(128,128,128,0.16)',
  },
})
