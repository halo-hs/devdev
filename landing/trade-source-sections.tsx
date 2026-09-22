import { useState } from "react"
import { ArrowRight, FileText } from "lucide-react"

export function TradeDealPreview() {
  return (
    <div className="trade-owner-preview">
      <span>거래건 · 제품 예시</span>
      <h3>확인된 문서가 거래건으로 모입니다</h3>
      <div>
        <strong>ACME GmbH</strong>
        <span>선적 준비</span>
      </div>
      <p>DL-260917-01 · Stainless Steel Coil</p>
      <dl>
        <div>
          <dt>받을 돈</dt>
          <dd>USD 50,820</dd>
        </div>
        <div>
          <dt>확인한 서류</dt>
          <dd>Commercial Invoice</dd>
        </div>
        <div>
          <dt>다음 일정</dt>
          <dd>09.21 수금 예정</dd>
        </div>
      </dl>
    </div>
  )
}

export function TradeClosingPreview() {
  return (
    <div className="trade-owner-preview">
      <span>월마감 · 제품 예시</span>
      <h3>결산 · 영업 성과</h3>
      <div>
        <strong>2026년 9월</strong>
        <span>검토 중</span>
      </div>
      <p>확정된 달은 마감해 공식 숫자로 동결합니다.</p>
      <dl>
        <div>
          <dt>매출</dt>
          <dd>USD 50,820</dd>
        </div>
        <div>
          <dt>매입</dt>
          <dd>USD 38,400</dd>
        </div>
        <div>
          <dt>거래 GP</dt>
          <dd>USD 12,420</dd>
        </div>
      </dl>
      <p>세무사·더존 인계</p>
    </div>
  )
}

export function TradeMarketPreview() {
  return (
    <div className="trade-owner-preview">
      <span>시장 지표 · 예시 데이터</span>
      <h3>실시간 시장 지표</h3>
      <p>환율과 물류 벤치마크를 함께 참조합니다.</p>
      <dl>
        <div>
          <dt>USD/KRW</dt>
          <dd>1,382.40</dd>
        </div>
        <div>
          <dt>EUR/KRW</dt>
          <dd>1,498.20</dd>
        </div>
        <div>
          <dt>JPY/KRW</dt>
          <dd>9.12</dd>
        </div>
      </dl>
    </div>
  )
}

const questions = [
  [
    "이번 달 ACME 매출은?",
    "USD 50,820.00",
    "예시 거래 1건의 확정 송장 금액입니다.",
  ],
  [
    "확정 안 된 인보이스 몇 건?",
    "1건",
    "검토 중인 인보이스는 확정 매출에 포함되지 않습니다.",
  ],
  [
    "거래처별 미수금 합계는?",
    "ACME · USD 50,820.00",
    "예시 거래처의 미수금 합계입니다.",
  ],
  [
    "7일 내 순현금 흐름은?",
    "+ USD 12,420.00",
    "예정 수금 USD 50,820에서 지급 USD 38,400을 뺀 금액입니다.",
  ],
]

export function TradeQuestionPreview() {
  const [active, setActive] = useState(0)
  return (
    <div className="trade-timeline trade-question-layout">
      <ol className="trade-timeline-steps" aria-label="AI 질의 예시">
        {questions.map(([question], index) => (
          <li key={question}>
            <button
              type="button"
              aria-pressed={index === active}
              aria-controls="trade-question-answer"
              onClick={() => setActive(index)}
            >
              <span className="trade-timeline-title">
                <span>0{index + 1}</span>
                <h3>{question}</h3>
              </span>
            </button>
          </li>
        ))}
      </ol>
      <div className="trade-timeline-scene">
        <div
          id="trade-question-answer"
          className="trade-answer"
          aria-live="polite"
        >
          <div className="trade-chat-question">{questions[active][0]}</div>
          <div className="trade-chat-answer">
            <div>
              <span className="trade-answer-amount">
                {questions[active][1]}
              </span>
              <p>{questions[active][2]}</p>
            </div>
          </div>
          <div className="trade-answer-source">
            <FileText size={18} />
            <div>
              <strong>Commercial Invoice · INV-2026-0917</strong>
              <span>예시 거래 DL-260917-01</span>
            </div>
            <ArrowRight size={16} />
          </div>
          <p className="trade-demo-warning">
            제품 예시 데이터입니다. 질문 → 답변 → 근거 문서까지 한 흐름으로.
          </p>
        </div>
      </div>
    </div>
  )
}
