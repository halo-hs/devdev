import {
  ArrowRight,
  Camera,
  ArrowLeft,
  CloudUpload,
  WifiOff,
  ScanLine,
  Check,
  ClipboardCheck,
  FileCheck2,
  Home,
  Link2,
  MessageSquare,
  Package,
  ShieldCheck,
  Sparkles,
  Wrench,
} from "lucide-react"

const screens = {
  create: {
    title: "작업 요청 입력",
    description: "말로 요청한 현장 작업을 AI가 정리하는 일러스트",
  },
  checklist: {
    title: "AI 작업 범위 확인",
    description:
      "작업 전 상태, 작업 결과와 확인할 부분을 촬영 목록으로 정리하는 일러스트",
  },
  capture: {
    title: "모바일 현장 작업",
    description:
      "휴대폰에서 작업코드로 진입해 단계별로 사진을 촬영하고, 오프라인 저장과 자동 업로드 상태를 확인하는 ECOYA SNAP 예시",
  },
  review: {
    title: "제출 증거 검토",
    description: "모인 증거를 사람이 확인해 하나의 기록으로 남기는 일러스트",
  },
  web: {
    title: "고객용 웹 리포트",
    description: "사진과 승인 상태를 링크 하나로 전달하는 웹 리포트 일러스트",
  },
  pdf: {
    title: "제출용 리포트 미리보기",
    description:
      "체크리스트, 사진 부록과 서명 정보가 정리된 PDF 리포트 일러스트",
  },
} as const
export type SnapScreenName = keyof typeof screens

function EvidenceTiles() {
  return (
    <div className="snap-art-photos">
      <div>
        <Home />
        <span>작업 전</span>
      </div>
      <div>
        <Wrench />
        <span>작업 결과</span>
      </div>
      <div>
        <Package />
        <span>상태 확인</span>
      </div>
    </div>
  )
}
function Checklist() {
  return (
    <div className="snap-art-checklist">
      {["작업 전 상태", "작업 결과", "확인할 부분"].map((label) => (
        <div key={label}>
          <Check />
          <span>{label}</span>
        </div>
      ))}
    </div>
  )
}
function CaptureArtwork() {
  return (
    <div className="snap-capture-composition">
      <div className="snap-capture-app">
        <div className="snap-capture-toolbar">
          <ArrowLeft size={16} />
          <strong>ECOYA SNAP</strong>
          <ScanLine size={18} />
        </div>
        <div className="snap-capture-job">
          <span>
            작업코드 <b>E69554</b>
          </span>
          <span className="snap-capture-working">작업 중</span>
        </div>
        <div className="snap-capture-heading">
          <strong>단계별로, 빠짐없이.</strong>
          <p>컨테이너 KMTU9349455</p>
        </div>
        <div className="snap-capture-steps">
          <span>
            <Check size={12} /> 외관
          </span>
          <span className="is-current">02 씰 촬영</span>
          <span>03 적재</span>
        </div>
        <div className="snap-capture-evidence">
          <div className="snap-capture-evidence-title">
            <strong>씰 근접 촬영</strong>
            <span>4 / 4</span>
          </div>
          <p>씰 번호가 선명하게 보이도록 촬영해주세요.</p>
          <div className="snap-capture-photo-grid">
            {[0, 1, 2, 3].map((index) => (
              <div
                key={index}
                className={`snap-capture-photo snap-capture-photo-${index}`}
              >
                <span>
                  <Check size={10} />
                </span>
              </div>
            ))}
          </div>
          <div className="snap-capture-seal-number">
            <span>씰 번호</span>
            <strong>PUS2509624</strong>
            <Check size={13} />
          </div>
        </div>
        <div className="snap-capture-camera-action">
          <Camera size={16} />
          다음 단계 촬영하기
        </div>
        <div className="snap-capture-safe">
          <ShieldCheck size={13} />
          촬영한 사진은 기기에 안전하게 저장됩니다
        </div>
      </div>
      <div className="snap-capture-sync">
        <span className="snap-capture-sync-icon">
          <CloudUpload size={22} />
        </span>
        <div>
          <small>현장에서 사무실까지</small>
          <strong>사진 전송 현황</strong>
        </div>
        <ol>
          <li>
            <i className="is-waiting" />
            전송 대기<span>기기 저장</span>
          </li>
          <li>
            <i className="is-uploading" />
            전송 중<span>자동 업로드</span>
          </li>
          <li>
            <Check size={12} />
            완료<span>사무실 공유</span>
          </li>
        </ol>
        <div className="snap-capture-offline">
          <WifiOff size={13} />
          <span>
            연결이 끊겨도 촬영은 계속.
            <br />
            다시 연결되면 자동 업로드.
          </span>
        </div>
      </div>
    </div>
  )
}

// A shared field example connects the four conceptual landing scenes.
const fieldShots = [
  { title: "컨테이너 외관", detail: "전체 모습과 손상 부위", kind: "exterior" },
  { title: "씰 번호 확인", detail: "번호가 보이도록 가까이", kind: "seal" },
  { title: "적재 상태", detail: "내부와 고정 상태", kind: "cargo" },
] as const

function FieldScene({
  kind = "exterior",
}: {
  kind?: "exterior" | "seal" | "cargo"
}) {
  return (
    <svg
      viewBox="0 0 240 150"
      fill="none"
      className="snap-field-scene"
      aria-hidden="true"
    >
      <rect width="240" height="150" rx="12" fill="#E8F0FB" />
      <path d="M0 119L240 103V150H0Z" fill="#D6E3F3" />
      {kind === "exterior" && (
        <>
          <path d="M28 51L168 30L217 54L78 79Z" fill="#5C99E4" />
          <path d="M28 51L78 79V128L28 102Z" fill="#1C3D61" />
          <path d="M78 79L217 54V104L78 128Z" fill="#166DD7" />
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
            <path
              key={i}
              d={`M${89 + i * 16} ${81 - i * 2.9}v39`}
              stroke="#8ABBFA"
              strokeWidth="3"
            />
          ))}
          <path
            d="M36 58V98M49 65V105M62 72V113"
            stroke="#7394BC"
            strokeWidth="3"
          />
          <path
            d="M16 38V25H39M201 22H224V39M16 113V132H38M205 124H228V106"
            stroke="#166DD7"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </>
      )}
      {kind === "seal" && (
        <>
          <rect x="53" y="15" width="135" height="123" rx="4" fill="#1C3D61" />
          <path
            d="M66 25V125M93 25V125M147 25V125M174 25V125"
            stroke="#426994"
            strokeWidth="9"
          />
          <path d="M119 19V132" stroke="#AFC5DD" strokeWidth="6" />
          <rect x="99" y="60" width="41" height="12" rx="3" fill="#DAE7F6" />
          <path
            d="M123 67V95Q123 108 111 108Q99 108 99 95V81"
            stroke="#5AA0F5"
            strokeWidth="5"
          />
          <rect x="86" y="79" width="21" height="31" rx="4" fill="#FFFFFF" />
          <path
            d="M92 86H101M92 91H101M92 97H98"
            stroke="#166DD7"
            strokeWidth="2"
          />
          <circle cx="158" cy="108" r="22" fill="#166DD7" />
          <path
            d="M148 108L155 115L169 101"
            stroke="white"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </>
      )}
      {kind === "cargo" && (
        <>
          <path d="M42 28H199V127H42Z" fill="#1C3D61" />
          <path d="M60 44H180V112H60Z" fill="#0F1E36" />
          <path
            d="M60 44L78 59H165L180 44M78 59V111M165 59V111"
            stroke="#5F7B9D"
            strokeWidth="2"
          />
          {[
            { x: 69, y: 78 },
            { x: 110, y: 78 },
            { x: 91, y: 47 },
          ].map(({ x, y }) => (
            <g key={x}>
              <rect x={x} y={y} width="38" height="32" rx="2" fill="#BBD3EE" />
              <path d={`M${x + 16} ${y}v12h7V${y}`} fill="#709ACC" />
              <path
                d={`M${x + 7} ${y + 24}h9`}
                stroke="#416A99"
                strokeWidth="2"
              />
            </g>
          ))}
          <path
            d="M34 132H207"
            stroke="#166DD7"
            strokeWidth="5"
            strokeLinecap="round"
          />
        </>
      )}
    </svg>
  )
}

function RequestArtwork() {
  return (
    <div className="snap-storyboard snap-request-board">
      <div className="snap-request-scene">
        <FieldScene />
        <span className="snap-scene-tag">
          <Camera size={14} /> 사진으로 남길 작업
        </span>
      </div>
      <div className="snap-request-message">
        <span>이렇게 말하면</span>
        <strong>
          “컨테이너 외관과 씰 번호,
          <br />
          적재 상태를 사진으로 남겨줘.”
        </strong>
        <div className="snap-request-wave">
          {Array.from({ length: 18 }, (_, i) => (
            <i key={i} style={{ height: `${8 + (i % 5) * 4}px` }} />
          ))}
          <MessageSquare size={20} />
        </div>
      </div>
      <div className="snap-board-footer">
        <span>
          <Sparkles size={16} /> 한 문장을 촬영 계획으로
        </span>
        <ArrowRight size={18} />
      </div>
    </div>
  )
}

function PlanArtwork() {
  return (
    <div className="snap-storyboard snap-plan-board">
      <div className="snap-plan-title">
        <div>
          <span>요청에 맞춰 정리한</span>
          <strong>빠짐없는 촬영 목록</strong>
        </div>
        <span className="snap-plan-count">
          03<small>촬영 항목</small>
        </span>
      </div>
      <div className="snap-plan-rows">
        {fieldShots.map((shot, i) => (
          <div
            className="snap-plan-row"
            key={shot.kind}
            style={{ animationDelay: `${i * 120}ms` }}
          >
            <FieldScene kind={shot.kind} />
            <div>
              <span>0{i + 1}</span>
              <strong>{shot.title}</strong>
              <p>{shot.detail}</p>
            </div>
            <span className="snap-plan-camera">
              <Camera size={18} />
            </span>
          </div>
        ))}
      </div>
      <div className="snap-board-footer">
        <span>
          <ClipboardCheck size={17} /> 목록대로 찍으면 준비 끝
        </span>
        <Check size={18} />
      </div>
    </div>
  )
}

function ReviewArtwork() {
  return (
    <div className="snap-storyboard snap-review-board">
      <div className="snap-review-title">
        <strong>
          사진이 모여,
          <br />
          하나의 근거가 됩니다.
        </strong>
        <span>
          <ShieldCheck size={32} />
        </span>
      </div>
      <div className="snap-review-evidence">
        {fieldShots.map((shot) => (
          <div key={shot.kind}>
            <FieldScene kind={shot.kind} />
            <span>
              <Check size={13} />
              {shot.title}
            </span>
          </div>
        ))}
      </div>
      <div className="snap-review-summary">
        <div>
          <span className="snap-review-avatar">김</span>
          <div>
            <strong>담당자 확인 완료</strong>
            <small>항목별 사진 · 검토 이력 보존</small>
          </div>
        </div>
        <span>
          <Check size={15} /> 확인
        </span>
      </div>
      <div className="snap-review-delivery">
        <span>
          <Link2 size={21} />
          <strong>웹 리포트</strong>
          <small>링크 하나로 공유</small>
        </span>
        <ArrowRight size={18} />
        <span>
          <FileCheck2 size={21} />
          <strong>PDF 성적서</strong>
          <small>제출 문서로 정리</small>
        </span>
      </div>
    </div>
  )
}

function SnapIllustration({ name }: { name: SnapScreenName }) {
  return (
    <div
      className={`snap-art snap-art-${name}`}
      role="img"
      aria-label={screens[name].description}
    >
      <div className="snap-art-stage" aria-hidden="true">
        {name === "create" && <RequestArtwork />}
        {name === "checklist" && <PlanArtwork />}
        {name === "capture" && <CaptureArtwork />}
        {name === "review" && <ReviewArtwork />}
        {name === "web" && (
          <div className="snap-art-sheet snap-art-browser">
            <div className="snap-art-browserbar">
              <i />
              <i />
              <i />
              <Link2 />
            </div>
            <span className="snap-art-kicker">고객에게 전하는 기록</span>
            <strong>확인된 현장 리포트</strong>
            <EvidenceTiles />
            <div className="snap-art-approved">
              <ShieldCheck />
              항목별 증거와 확인 상태
            </div>
            <span className="snap-art-bottom">
              <Link2 />
              링크 하나로 공유
            </span>
          </div>
        )}
        {name === "pdf" && (
          <div className="snap-art-sheet snap-art-document">
            <span className="snap-art-kicker">
              <FileCheck2 />
              검사 성적서
            </span>
            <strong>
              확인된 결과를
              <br />한 문서에.
            </strong>
            <Checklist />
            <div className="snap-art-document-lines">
              <i />
              <i />
              <i />
            </div>
            <div className="snap-art-signature">
              <span>사진 부록 · 서명 · 발행 정보</span>
              <ShieldCheck />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export function SnapScreen({
  name,
}: {
  name: SnapScreenName
  eager?: boolean
}) {
  return (
    <figure className={`ecoya-snap-screen ecoya-snap-screen-${name}`}>
      <SnapIllustration name={name} />
    </figure>
  )
}
