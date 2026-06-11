import { StyleSheet } from "react-native";

export const colors = {
  blue: "#2563eb",
  blueDark: "#1d4ed8",
  blueSoft: "#dbeafe",
  text: "#0f172a",
  muted: "#64748b",
  line: "#e2e8f0",
  card: "#ffffff",
  bg: "#f8fafc",
  danger: "#ef4444",
  warning: "#f97316",
  green: "#16a34a",
  purple: "#9333ea"
};

export const sharedStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg
  },
  content: {
    padding: 14,
    paddingBottom: 22,
    gap: 11
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.line
  },
  elevatedCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 15,
    borderWidth: 1,
    borderColor: colors.line,
    shadowColor: "#0f172a",
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3
  },
  title: {
    color: colors.text,
    fontSize: 32,
    fontWeight: "900"
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "900",
    flexShrink: 1
  },
  body: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 22,
    flexShrink: 1
  },
  muted: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
    flexShrink: 1
  },
  primaryButton: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.blue,
    borderRadius: 14,
    paddingVertical: 13,
    paddingHorizontal: 14
  },
  secondaryButton: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.blueSoft,
    borderRadius: 14,
    paddingVertical: 13,
    paddingHorizontal: 14
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "900"
  },
  secondaryButtonText: {
    color: colors.blue,
    fontSize: 15,
    fontWeight: "900"
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 10
  },
  chip: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: "#ffffff"
  },
  chipText: {
    color: colors.text,
    fontWeight: "800"
  },
  smallBadge: {
    borderRadius: 999,
    overflow: "hidden",
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 12,
    fontWeight: "900"
  }
});
