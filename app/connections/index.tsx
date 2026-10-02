import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  TextInput,
  View,
} from 'react-native'
import { useRouter } from 'expo-router'
import { ScreenHeader } from '@/components/ScreenHeader'
import { Text } from '@/components/Text'
import { Avatar } from '@/components/Avatar'
import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import { EmptyState } from '@/components/EmptyState'
import { Input } from '@/components/Input'
import { LoadingScreen } from '@/components/Skeleton'
import { connectionService } from '@/services/connectionService'
import { timeAgo } from '@/utils/format'
import { useAppTheme } from '@/hooks/useAppTheme'
import { ScannedContact, TagSummary } from '@/types'
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
  const [tagSummary, setTagSummary] = useState<TagSummary[]>([])
  const [editing, setEditing] = useState<ScannedContact | null>(null)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    const [list, summary] = await Promise.all([
      connectionService.getRecentConnections(),
      connectionService.getTagSummary().catch(() => [] as TagSummary[]),
    ])
    return { list, summary }
  }, [])

  useEffect(() => {
    let active = true
    void load().then(({ list, summary }) => {
      if (!active) return
      setContacts(list)
      setTagSummary(summary)
    })
    return () => {
      active = false
    }
  }, [load])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await load()
      .then(({ list, summary }) => {
        setContacts(list)
        setTagSummary(summary)
      })
      .catch(() => {})
    setRefreshing(false)
  }, [load])

  const onTagsSaved = useCallback((updated: ScannedContact) => {
    setContacts((prev) => prev?.map((c) => (c.id === updated.id ? updated : c)) ?? prev ?? null)
    setEditing(null)
    void connectionService
      .getTagSummary()
      .then(setTagSummary)
      .catch(() => {})
  }, [])

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
                <Pressable
                  key={c.id}
                  onPress={() => setEditing(c)}
                  accessibilityRole="button"
                  accessibilityLabel={`Tag ${c.name}`}
                  style={({ pressed }) => [
                    styles.row,
                    i === items.length - 1 ? null : styles.divider,
                    pressed ? styles.rowPressed : null,
                  ]}
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
                  <Text variant="caption" color="accent">
                    Tags
                  </Text>
                </Pressable>
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
      {editing ? (
        <TagEditor
          contact={editing}
          suggestions={tagSummary}
          onClose={() => setEditing(null)}
          onSaved={onTagsSaved}
        />
      ) : null}
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

const MAX_TAGS = 12

function TagEditor({
  contact,
  suggestions,
  onClose,
  onSaved,
}: {
  contact: ScannedContact
  suggestions: TagSummary[]
  onClose: () => void
  onSaved: (updated: ScannedContact) => void
}) {
  const { colors } = useAppTheme()
  const [tags, setTags] = useState<string[]>(contact.tags ?? [])
  const [draft, setDraft] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const addTag = (value: string) => {
    const next = value.trim().toLowerCase()
    if (!next) return
    if (tags.includes(next)) {
      setDraft('')
      return
    }
    if (tags.length >= MAX_TAGS) {
      setError(`Up to ${MAX_TAGS} tags per connection.`)
      return
    }
    setTags([...tags, next])
    setDraft('')
    setError(null)
  }

  const save = async () => {
    setSaving(true)
    setError(null)
    try {
      onSaved(await connectionService.setTags(contact.id, tags))
    } catch {
      setError('Could not save those tags. Check your connection and try again.')
    } finally {
      setSaving(false)
    }
  }

  const unused = suggestions.filter((s) => !tags.includes(s.tag)).slice(0, 6)

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close" />
      <View style={[styles.sheet, { backgroundColor: colors.background }]}>
        <View style={styles.sheetHeader}>
          <Text variant="heading" numberOfLines={1}>
            {`Tag ${contact.name}`}
          </Text>
          <Text variant="caption" color="muted">
            Groups this connection under the Tagged filter, so you can filter by it later.
          </Text>
        </View>

        {tags.length > 0 ? (
          <View style={styles.chips}>
            {tags.map((tag) => (
              <Chip
                key={tag}
                label={`${tag}  ✕`}
                active
                onPress={() => setTags(tags.filter((t) => t !== tag))}
              />
            ))}
          </View>
        ) : (
          <Text variant="body" color="muted">
            No tags yet.
          </Text>
        )}

        <Input
          label="Add a tag"
          placeholder="client, follow-up, vip…"
          value={draft}
          onChangeText={setDraft}
          onSubmitEditing={() => addTag(draft)}
          returnKeyType="done"
        />

        {unused.length > 0 ? (
          <View style={styles.chips}>
            {unused.map((s) => (
              <Chip
                key={s.tag}
                label={`${s.tag} · ${s.count}`}
                active={false}
                onPress={() => addTag(s.tag)}
              />
            ))}
          </View>
        ) : null}

        {error ? (
          <Text variant="caption" color="danger">
            {error}
          </Text>
        ) : null}

        <Button
          label={saving ? 'Saving…' : 'Save tags'}
          onPress={() => void save()}
          loading={saving}
          fullWidth
        />
      </View>
    </Modal>
  )
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
  rowPressed: { opacity: 0.6 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: {
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    gap: spacing.md,
    padding: spacing.xl,
    paddingBottom: spacing['3xl'],
  },
  sheetHeader: { gap: spacing.xs },
  divider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(128,128,128,0.16)',
  },
})
