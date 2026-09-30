import { Component, ErrorInfo, ReactNode } from 'react'
import { ScrollView, StyleSheet, View } from 'react-native'
import { useAppTheme } from '@/hooks/useAppTheme'
import { Text } from '@/components/Text'
import { Button } from '@/components/Button'
import { reportError } from '@/services/errorReporting'
import { spacing, radius } from '@/theme'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

/**
 * Catches render-time crashes below it so a single bad screen shows a recovery
 * prompt instead of a blank white screen with no way back.
 *
 * This has to be a class component: React exposes no hook equivalent for
 * `componentDidCatch`.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    reportError(error, {
      screen: 'root',
      componentStack: info.componentStack ?? undefined,
    })
  }

  private handleReset = () => {
    this.setState({ error: null })
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children
    return <Fallback error={error} onRetry={this.handleReset} />
  }
}

function Fallback({ error, onRetry }: { error: Error; onRetry: () => void }) {
  const { colors } = useAppTheme()

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.iconCircle, { backgroundColor: colors.statusDangerBg }]}>
          <Text variant="display" style={{ color: colors.statusDanger }}>
            !
          </Text>
        </View>

        <Text variant="title" align="center" style={styles.title}>
          Something went wrong
        </Text>

        <Text variant="body" color="secondary" align="center">
          The app hit an unexpected error. Your saved data is still on this device.
        </Text>

        <View style={[styles.detailBox, { backgroundColor: colors.surfaceSecondary }]}>
          <Text variant="caption" color="muted" style={styles.detailLabel}>
            Error details
          </Text>
          <Text variant="caption" color="secondary" selectable>
            {error.message || 'Unknown error'}
          </Text>
        </View>

        <Button label="Try again" onPress={onRetry} fullWidth />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  iconCircle: {
    alignSelf: 'center',
    width: 72,
    height: 72,
    borderRadius: radius.full ?? 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    marginBottom: spacing.xs,
  },
  detailBox: {
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.xs,
    marginVertical: spacing.md,
  },
  detailLabel: {
    textTransform: 'uppercase',
  },
})
