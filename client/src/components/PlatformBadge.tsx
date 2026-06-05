/**
 * Colored pill showing the detected platform.
 * Purely presentational.
 */

import type { Platform } from "../types/media";
import { PLATFORM_LABELS } from "../lib/format";

interface Props {
  platform: Platform;
}

export function PlatformBadge({ platform }: Props) {
  return (
    <span className={`badge badge--${platform}`}>{PLATFORM_LABELS[platform]}</span>
  );
}
