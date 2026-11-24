import { downloadStored, useStoredFileUrl } from "../app/files";
import { WORKER_TEXT } from "../domain/labels";
import { isLanguage, type MediaAsset } from "../domain/types";
import { Button } from "./ui";

interface Props {
  media: Pick<MediaAsset, "type" | "title" | "fileKey" | "mimeType">;
  language?: string;
  onOpened?: () => void;
  onPlayed?: () => void;
}

/** Shows an approved media file: image inline, audio player, or a slide download. */
export function MediaPreview({ media, language = "en", onOpened, onPlayed }: Props) {
  const text = WORKER_TEXT[isLanguage(language) ? language : "en"];
  const inline = media.type !== "slide";
  const url = useStoredFileUrl(inline ? media.fileKey : null, media.mimeType);
  return (
    <figure className="media">
      <figcaption>
        <strong lang={language}>{text.media[media.type]}</strong>
        <span className="muted" lang={language}>
          {" "}
          · {media.title}
        </span>
      </figcaption>
      {media.type === "slide" && (
        <Button
          variant="secondary"
          onClick={() => {
            onOpened?.();
            downloadStored(media.fileKey, `${media.title}.pptx`, media.mimeType);
          }}
        >
          <span lang={language}>{text.downloadSlide}</span>
        </Button>
      )}
      {(media.type === "source_figure" || media.type === "annotated_diagram") && url && (
        <img src={url} alt={media.title} className="media-image" onLoad={onOpened} />
      )}
      {media.type === "narration" && url && (
        <audio controls src={url} onPlay={onPlayed} onLoadedData={onOpened}>
          Your browser does not support audio playback.
        </audio>
      )}
    </figure>
  );
}
