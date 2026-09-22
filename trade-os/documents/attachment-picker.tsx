import { useEffect, useRef, useState } from "react"
import { Upload, X } from "lucide-react"
import { Button } from "@shared/components/ui/button"
import {
  FileDropZone,
  type FileDropZoneRef,
} from "@ecoya/design-system/extensions/file-drop-zone"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@shared/components/ui/dialog"

export type DeliveryAttachment = {
  id: string
  name: string
  source: string
  file?: File
}

const candidates = [
  {
    id: "att-packing-list",
    name: "PackingList_0707.pdf",
    source: "인박스",
    reason: "현재 거래와 일치",
    allowed: true,
  },
  {
    id: "att-bank",
    name: "은행_입금확인서.pdf",
    source: "인박스",
    reason: "은행 보안문서 · 첨부 불가",
    allowed: false,
  },
  {
    id: "att-other-deal",
    name: "PO_OtherDeal.pdf",
    source: "인박스",
    reason: "다른 거래 문서 · 첨부 불가",
    allowed: false,
  },
]

export function DeliveryAttachmentPicker({
  open,
  onOpenChange,
  attachments,
  onChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  attachments: DeliveryAttachment[]
  onChange: (attachments: DeliveryAttachment[]) => void
}) {
  const fileZone = useRef<FileDropZoneRef>(null)
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)
  const upload = async (file: File) => {
    setError("")
    setBusy(true)
    try {
      const head = new Uint8Array(await file.slice(0, 8).arrayBuffer())
      const extension = file.name.split(".").at(-1)?.toLowerCase()
      const signature =
        extension === "pdf"
          ? [37, 80, 68, 70, 45]
          : extension === "png"
            ? [137, 80, 78, 71, 13, 10, 26, 10]
            : ["jpg", "jpeg"].includes(extension ?? "")
              ? [255, 216, 255]
              : null
      if (
        !signature ||
        !signature.every((value, index) => head[index] === value)
      ) {
        setError("PDF, PNG, JPG 파일을 선택하세요.")
        return
      }
      if (attachments.some((item) => item.name === file.name)) {
        setError("이미 동봉된 파일입니다.")
        return
      }
      onChange([
        ...attachments,
        { id: crypto.randomUUID(), name: file.name, source: "내 컴퓨터", file },
      ])
    } catch {
      setError("파일을 읽지 못했습니다. 다시 선택하세요.")
    } finally {
      setBusy(false)
    }
  }
  if (!open) return null
  return (
    <section
      id="delivery-attachment-picker"
      aria-label="동봉 파일 선택"
      className="space-y-4"
    >
      <div className="space-y-2">
        <FileDropZone
          ref={fileZone}
          id="delivery-attachment-upload"
          accept=".pdf,.png,.jpg,.jpeg"
          disabled={busy}
          aria-label="새 동봉 파일 업로드"
          label={busy ? "파일 확인 중…" : "파일을 끌어다 놓으세요"}
          instructions="PDF · PNG · JPG · 클릭하여 파일 선택"
          onFiles={(files) => {
            if (files[0]) void upload(files[0])
          }}
        />
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={() => fileZone.current?.open()}
          >
            <Upload /> 파일 선택
          </Button>
        </div>
      </div>
      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
      <div>
        <h3 className="mb-2 text-sm font-semibold">기존 문서</h3>
        <ul className="divide-y">
          {candidates.map((item) => {
            const added = attachments.some(
              (attachment) => attachment.name === item.name
            )
            return (
              <li key={item.id}>
                <label
                  className={`flex min-h-12 items-center gap-3 py-2 transition-colors focus-within:ring-2 focus-within:ring-ring ${!item.allowed ? "cursor-not-allowed text-muted-foreground" : added ? "cursor-pointer text-primary" : "cursor-pointer hover:text-primary"}`}
                >
                  <input
                    type="checkbox"
                    checked={added}
                    disabled={busy || !item.allowed}
                    aria-label={item.name}
                    aria-describedby={`${item.id}-reason`}
                    className="size-4 shrink-0 cursor-pointer accent-primary disabled:cursor-not-allowed"
                    onChange={() => {
                      if (!item.allowed || busy) return
                      setError("")
                      onChange(
                        added
                          ? attachments.filter(
                              (attachment) => attachment.name !== item.name
                            )
                          : [
                              ...attachments,
                              {
                                id: item.id,
                                name: item.name,
                                source: item.source,
                              },
                            ]
                      )
                    }}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium break-all">
                      {item.name}
                    </span>
                    <span
                      id={`${item.id}-reason`}
                      className="mt-0.5 block text-xs text-muted-foreground"
                    >
                      {item.reason}
                    </span>
                  </span>
                  {added && (
                    <span className="shrink-0 text-xs font-semibold text-primary">
                      선택됨
                    </span>
                  )}
                </label>
              </li>
            )
          })}
        </ul>
      </div>
      <div className="flex items-center justify-between border-t pt-3">
        <span className="text-xs text-muted-foreground">
          동봉 파일 {attachments.length}개
        </span>
        <Button disabled={busy} onClick={() => onOpenChange(false)}>
          선택 완료
        </Button>
      </div>
    </section>
  )
}

export function DeliveryAttachmentPreview({
  name,
  blob,
  sample,
  onClose,
}: {
  name: string
  blob: Blob
  sample: boolean
  onClose: () => void
}) {
  const [url, setUrl] = useState("")
  useEffect(() => {
    const objectUrl = URL.createObjectURL(blob)
    // Object URLs are external resources: create and revoke them with the preview lifetime.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUrl(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [blob])
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="flex h-[85dvh] flex-col sm:max-w-3xl"
      >
        <DialogHeader className="min-w-0 pr-10">
          <DialogTitle className="break-all">{name}</DialogTitle>
          <DialogDescription>
            {sample ? "예시 파일 미리보기" : "동봉 파일 미리보기"}
          </DialogDescription>
        </DialogHeader>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="동봉 파일 미리보기 닫기"
          className="absolute top-3 right-3"
          onClick={onClose}
        >
          <X />
        </Button>
        {!url ? null : blob.type.startsWith("image/") ? (
          <img src={url} alt={name} className="min-h-0 flex-1 object-contain" />
        ) : (
          <iframe
            title={`${name} 미리보기`}
            src={url}
            className="min-h-0 w-full flex-1 rounded-md border"
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
