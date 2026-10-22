import { useEffect, useId, useRef, useState } from "react"
import { ImagePlus, Upload, X } from "lucide-react"
import { Button } from "@shared/components/ui/button"

type LogoPreview = { url: string; name: string; size: number }

export function BrandLogoInput({ disabled, onChange }: { disabled: boolean; onChange: () => void }) {
  const input = useRef<HTMLInputElement>(null)
  const request = useRef(0)
  const activeUrl = useRef<string | null>(null)
  const helperId = useId()
  const errorId = useId()
  const [logo, setLogo] = useState<LogoPreview | null>(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => () => {
    request.current += 1
    if (activeUrl.current) URL.revokeObjectURL(activeUrl.current)
  }, [])

  async function selectFile(file: File) {
    if (disabled) return
    const selection = ++request.current
    setError("")
    setLoading(true)
    let candidateUrl: string | null = null
    try {
      const extension = file.name.split(".").pop()?.toLowerCase()
      const isPng = extension === "png"
      const isJpeg = extension === "jpg" || extension === "jpeg"
      if ((!isPng && !isJpeg) || (file.type && file.type !== (isPng ? "image/png" : "image/jpeg"))) {
        throw new Error("PNG 또는 JPG/JPEG 이미지를 선택해 주세요. SVG는 사용할 수 없습니다.")
      }
      const bytes = new Uint8Array(await file.slice(0, 8).arrayBuffer())
      const validSignature = isPng
        ? [137, 80, 78, 71, 13, 10, 26, 10].every((value, index) => bytes[index] === value)
        : bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
      if (!validSignature) throw new Error("파일 형식을 확인해 주세요. PNG 또는 JPG/JPEG 이미지만 사용할 수 있습니다.")
      candidateUrl = URL.createObjectURL(file)
      const image = new Image()
      image.src = candidateUrl
      await image.decode()
      if (selection !== request.current) return
      if (activeUrl.current) URL.revokeObjectURL(activeUrl.current)
      activeUrl.current = candidateUrl
      setLogo({ url: candidateUrl, name: file.name, size: file.size })
      candidateUrl = null
      onChange()
    } catch (reason) {
      if (selection === request.current) {
        setError(reason instanceof Error && reason.name !== "EncodingError"
          ? reason.message
          : "이미지를 읽을 수 없습니다. 다른 PNG 또는 JPG/JPEG 파일을 선택해 주세요.")
      }
    } finally {
      if (candidateUrl) URL.revokeObjectURL(candidateUrl)
      if (selection === request.current) setLoading(false)
    }
  }

  function removeLogo() {
    request.current += 1
    if (activeUrl.current) URL.revokeObjectURL(activeUrl.current)
    activeUrl.current = null
    setLogo(null)
    setError("")
    setLoading(false)
    onChange()
  }

  return (
    <div className="space-y-3" aria-busy={loading}>
      <input
        ref={input}
        type="file"
        className="sr-only"
        tabIndex={-1}
        aria-label="문서 로고 파일"
        aria-describedby={`${helperId}${error ? ` ${errorId}` : ""}`}
        accept=".png,.jpg,.jpeg,image/png,image/jpeg"
        disabled={disabled || loading}
        onChange={(event) => {
          const file = event.target.files?.[0]
          event.target.value = ""
          if (file) void selectFile(file)
        }}
      />
      {/* Image tile: shows the uploaded logo with a corner delete; when empty
          the dashed tile itself opens the file dialog. */}
      <div className="flex items-start justify-end gap-3">
        {logo ? (
          <div className="relative flex h-24 w-40 items-center justify-center overflow-hidden rounded-[var(--r-lg)] border border-[var(--color-gray-9)] bg-white p-3">
            <img src={logo.url} alt="문서 로고 미리보기" className="max-h-full max-w-full object-contain" />
            {!disabled ? (
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                aria-label="삭제"
                title="삭제"
                disabled={loading}
                onClick={removeLogo}
                className="absolute top-1.5 right-1.5 rounded-full bg-white/90 shadow-[var(--shadow-input)]"
              >
                <X />
              </Button>
            ) : null}
          </div>
        ) : (
          <button
            type="button"
            disabled={disabled || loading}
            onClick={() => input.current?.click()}
            className="flex h-24 w-40 flex-col items-center justify-center gap-1.5 rounded-[var(--r-lg)] border border-dashed border-[var(--color-gray-7)] bg-[var(--color-gray-11)] text-xs text-muted-foreground outline-none hover:border-[var(--color-primary-4)] hover:text-[var(--color-primary-4)] focus-visible:ring-2 focus-visible:ring-[var(--color-primary-4)] disabled:cursor-default disabled:hover:border-[var(--color-gray-7)] disabled:hover:text-muted-foreground"
          >
            <ImagePlus className="size-5" aria-hidden="true" />
            등록된 로고 없음
          </button>
        )}
      </div>
      {logo ? <div className="flex min-w-0 items-center justify-end gap-3 text-xs text-muted-foreground">
        <span className="truncate" title={logo.name}>{logo.name}</span>
        <span className="shrink-0 tabular-nums">{Math.max(1, Math.round(logo.size / 1024)).toLocaleString("ko-KR")} KB</span>
      </div> : null}
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button type="button" variant="outline" disabled={disabled || loading} onClick={() => input.current?.click()}>
          <Upload /> {loading ? "이미지 확인 중" : logo ? "파일 변경" : "파일 선택"}
        </Button>
      </div>
      <p id={helperId} className="text-right text-xs text-muted-foreground">PNG, JPG/JPEG</p>
      {error ? <p id={errorId} role="alert" className="text-sm text-destructive">{error}</p> : null}
    </div>
  )
}
