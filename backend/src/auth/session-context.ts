/** Device details the client sends when a token is minted, recorded per session. */
export interface SessionContext {
  deviceLabel?: string
  userAgent?: string
  ipAddress?: string
}
