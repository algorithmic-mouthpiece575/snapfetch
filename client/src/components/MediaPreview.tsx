/**
 * Preview card: thumbnail + metadata + download buttons (HD / standard) with
 * visual progress feedback.
 *
 * During a download, the active button shows either "Preparing…" (the server is
 * downloading/merging, no byte received) or a determinate progress bar while
 * the file is transferring.
 */

import type { Format, MediaInfo } from "../types/media";
import type { DownloadStatus } from "../App";
import { PlatformBadge } from "./PlatformBadge";
import { formatDuration, formatSize } from "../lib/format";
import { useTranslation } from "../i18n/context";

interface Props {
  media: MediaInfo;
  /** Triggers the download of a format. */
  onDownload: (format: Format) => void;
  /** In-progress download (phase + progress), or null. */
  download: DownloadStatus | null;
}

export function MediaPreview({ media, onDownload, download }: Props) {
  const { t } = useTranslation();
  // Keep the first format of each quality (the adapter only returns one
  // representative per quality).
  const hd = media.formats.find((f) => f.quality === "hd");
  const standard = media.formats.find((f) => f.quality === "standard");

  return (
    <article className="preview">
      <div className="preview__thumb">
        {media.thumbnail ? (
          <img src={media.thumbnail} alt="" loading="lazy" />
        ) : (
          <div className="preview__thumb-placeholder" aria-hidden="true" />
        )}
        {media.durationSec !== undefined && (
          <span className="preview__duration">
            {formatDuration(media.durationSec)}
          </span>
        )}
      </div>

      <div className="preview__body">
        <PlatformBadge platform={media.platform} />
        <h2 className="preview__title">{media.title}</h2>
        <p className="preview__author">{media.author}</p>

        <div className="preview__actions">
          {hd && (
            <DownloadButton
              format={hd}
              label={t.preview.hd}
              download={download}
              // An active download disables both buttons.
              disabled={download !== null}
              onClick={() => onDownload(hd)}
            />
          )}
          {standard && (
            <DownloadButton
              format={standard}
              label={t.preview.standard}
              variant="secondary"
              download={download}
              disabled={download !== null}
              onClick={() => onDownload(standard)}
            />
          )}
        </div>
      </div>
    </article>
  );
}

/**
 * Download button. Shows the quality/size at rest, and switches to a progress
 * indicator when this format is being downloaded.
 */
function DownloadButton({
  format,
  label,
  onClick,
  download,
  disabled,
  variant = "primary",
}: {
  format: Format;
  label: string;
  onClick: () => void;
  download: DownloadStatus | null;
  disabled: boolean;
  variant?: "primary" | "secondary";
}) {
  const { t } = useTranslation();
  // Is this the button that is downloading?
  const active = download?.format.quality === format.quality;
  const size = formatSize(format.sizeBytes);

  // Percentage if the total size is known, otherwise null (indeterminate).
  const percent =
    active && download && download.total
      ? Math.min(100, Math.round((download.received / download.total) * 100))
      : null;

  return (
    <button
      type="button"
      className={`dl-btn dl-btn--${variant}${active ? " dl-btn--active" : ""}`}
      onClick={onClick}
      disabled={disabled}
      aria-busy={active}
    >
      {/* Progress fill (bar behind the text). */}
      {active && (
        <span
          className={`dl-btn__fill${
            download?.phase === "preparing" ? " dl-btn__fill--indeterminate" : ""
          }`}
          style={percent !== null ? { width: `${percent}%` } : undefined}
          aria-hidden="true"
        />
      )}

      <span className="dl-btn__content">
        {active ? (
          <>
            <span className="dl-btn__label">
              {download?.phase === "preparing"
                ? t.preview.preparing
                : `${t.preview.downloading} ${percent ?? 0}%`}
            </span>
            <span className="dl-btn__meta">
              {download?.phase === "preparing"
                ? t.preview.preparingSub
                : download?.total
                  ? `${formatSize(download.received)} / ${formatSize(download.total)}`
                  : formatSize(download?.received)}
            </span>
          </>
        ) : (
          <>
            <span className="dl-btn__label">{label}</span>
            <span className="dl-btn__meta">
              {format.label ?? format.ext.toUpperCase()}
              {size ? ` · ${size}` : ""}
            </span>
          </>
        )}
      </span>
    </button>
  );
}
