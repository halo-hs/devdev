import { useEffect, useState, type FormEvent } from "react"
import { ArrowRight } from "lucide-react"
import { Button } from "@shared/components/ui/button"
import { Input } from "@shared/components/ui/input"
import { Textarea } from "@shared/components/ui/textarea"
import { FormField, FormFieldMessage } from "@shared/components/form-field"
import { LandingShell } from "../shared/layout"

export function ContactLanding() {
  const initialProduct = new URLSearchParams(window.location.search).get(
    "product"
  )
  const [product, setProduct] = useState(
    initialProduct === "erp" || initialProduct === "snap" ? initialProduct : ""
  )
  const [emailOpened, setEmailOpened] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)
  const validate = (form: HTMLFormElement) => {
    const data = new FormData(form)
    const next: Record<string, string> = {}
    for (const [name, message] of [
      ["company", "회사명을 입력해 주세요."],
      ["name", "담당자 이름을 입력해 주세요."],
      ["email", "이메일을 입력해 주세요."],
      ["message", "문의 내용을 입력해 주세요."],
    ]) {
      if (!String(data.get(name) ?? "").trim()) next[name] = message
    }
    const email = form.elements.namedItem("email") as HTMLInputElement
    if (
      !next.email &&
      (email.validity.typeMismatch ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim()))
    )
      next.email = "이메일 주소 형식을 확인해 주세요. 예: name@company.com"
    const phone = String(data.get("phone") ?? "").trim()
    if (phone && !/^010(?:[ -]?\d{4}){2}$/.test(phone))
      next.phone = "휴대폰 번호 형식을 확인해 주세요. 예: 010-1234-5678"
    if (!data.get("consent"))
      next.consent = "개인정보 수집·이용에 동의해 주세요."
    return next
  }
  const errorProps = (name: string) => ({
    message: errors[name],
    messageId: `contact-${name}-error`,
    tone: "danger" as const,
  })
  const controlProps = (name: string) => ({
    "aria-invalid": Boolean(errors[name]),
    "aria-describedby": errors[name] ? `contact-${name}-error` : undefined,
  })
  useEffect(() => {
    document.title = "ECOYA — 도입 문의"
  }, [])
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.currentTarget
    setSubmitted(true)
    const nextErrors = validate(form)
    setErrors(nextErrors)
    const firstError = Object.keys(nextErrors)[0]
    if (firstError) {
      const control = form.elements.namedItem(firstError)
      if (control instanceof HTMLElement) control.focus()
      return
    }
    const data = new FormData(form)
    const value = (name: string) => String(data.get(name) ?? "").trim()
    const subject = `[ECOYA 문의] ${value("company")} ${value("name")}`
    const body = [
      `회사명: ${value("company")}`,
      `담당자: ${value("name")}`,
      `이메일: ${value("email")}`,
      `연락처: ${value("phone")}`,
      `관심 제품: ${product === "erp" ? "ECOYA Trade OS" : product === "snap" ? "ECOYA SNAP" : product === "other" ? "기타" : "상담 희망"}`,
      "",
      "문의 내용:",
      value("message"),
      "",
      "개인정보 수집·이용 동의: 동의함",
    ].join("\n")
    window.location.href = `mailto:contact@ecoya.kr?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    setEmailOpened(true)
  }
  return (
    <LandingShell page="contact" product={product === "snap" ? "snap" : "erp"}>
      <main className="ecoya-contact-page">
        <div className="trade-container trade-section">
          <div className="ecoya-contact-heading">
            <p className="trade-section-label">도입 문의</p>
            <h1>무엇을 도와드릴까요?</h1>
            <p>제품 도입·데모·협업에 대해 궁금한 점을 남겨주세요.</p>
          </div>
          <form
            className="ecoya-contact-form"
            noValidate
            onSubmit={submit}
            onBlur={(event) => {
              const target = event.target
              if (!(
                target instanceof HTMLInputElement ||
                target instanceof HTMLTextAreaElement
              ))
                return
              const field = target.name
              const next = validate(event.currentTarget)
              setErrors((previous) => {
                const updated = { ...previous }
                if (next[field]) updated[field] = next[field]
                else delete updated[field]
                return updated
              })
            }}
            onChange={(event) => {
              const target = event.target
              if (!(
                target instanceof HTMLInputElement ||
                target instanceof HTMLTextAreaElement
              ))
                return
              if (submitted) setErrors(validate(event.currentTarget))
              else if (errors[target.name]) {
                const field = target.name
                const next = validate(event.currentTarget)
                setErrors((previous) => {
                  const updated = { ...previous }
                  if (next[field]) updated[field] = next[field]
                  else delete updated[field]
                  return updated
                })
              }
            }}
          >
            <div className="ecoya-contact-fields">
              <FormField
                label="회사명 (필수)"
                htmlFor="contact-company"
                {...errorProps("company")}
              >
                <Input
                  id="contact-company"
                  {...controlProps("company")}
                  name="company"
                  autoComplete="organization"
                  required
                />
              </FormField>
              <FormField
                label="담당자 이름 (필수)"
                htmlFor="contact-name"
                {...errorProps("name")}
              >
                <Input
                  id="contact-name"
                  {...controlProps("name")}
                  name="name"
                  autoComplete="name"
                  required
                />
              </FormField>
              <FormField
                label="이메일 (필수)"
                htmlFor="contact-email"
                {...errorProps("email")}
              >
                <Input
                  id="contact-email"
                  {...controlProps("email")}
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                />
              </FormField>
              <FormField
                label="휴대폰 번호 (선택)"
                htmlFor="contact-phone"
                {...errorProps("phone")}
              >
                <Input
                  id="contact-phone"
                  {...controlProps("phone")}
                  name="phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="010-1234-5678"
                />
              </FormField>
            </div>
            <FormField label="관심 제품 (선택)" htmlFor="contact-product">
              <select
                id="contact-product"
                name="product"
                value={product}
                onChange={(event) => setProduct(event.target.value)}
              >
                <option value="">아직 잘 모르겠어요 · 상담받고 싶어요</option>
                <option value="erp">ECOYA Trade OS</option>
                <option value="snap">ECOYA SNAP</option>
                <option value="other">기타</option>
              </select>
            </FormField>
            <FormField
              label="문의 내용 (필수)"
              htmlFor="contact-message"
              {...errorProps("message")}
            >
              <Textarea
                id="contact-message"
                {...controlProps("message")}
                name="message"
                rows={5}
                required
                placeholder="현재 업무나 궁금한 점을 자유롭게 적어주세요."
              />
            </FormField>
            <section
              id="contact-privacy"
              className="ecoya-contact-privacy"
              aria-labelledby="contact-privacy-title"
            >
              <h2 id="contact-privacy-title">개인정보 수집·이용 안내</h2>
              <dl>
                <div>
                  <dt>수집 항목</dt>
                  <dd>
                    필수: 회사명, 담당자 이름, 이메일, 문의 내용
                    <br />
                    선택: 연락처, 관심 제품
                  </dd>
                </div>
                <div>
                  <dt>이용 목적</dt>
                  <dd>제품 도입·데모·협업 문의 확인, 상담 및 답변 전달</dd>
                </div>
                <div>
                  <dt>보유·이용 기간</dt>
                  <dd>
                    문의 응대 완료 시까지 보유·이용하며, 목적 달성 후 지체 없이
                    파기합니다. 관계 법령에 따른 보존 의무가 있는 경우에는 해당
                    법정 기간 동안 별도 보관합니다.
                  </dd>
                </div>
                <div>
                  <dt>동의 거부 안내</dt>
                  <dd>
                    동의를 거부할 수 있으나, 필수 항목 수집·이용에 동의하지
                    않으면 이 양식으로 문의할 수 없습니다. 선택 항목을 입력하지
                    않아도 문의할 수 있습니다.
                  </dd>
                </div>
              </dl>
            </section>
            <label className="ecoya-contact-consent">
              <input
                type="checkbox"
                name="consent"
                required
                aria-invalid={Boolean(errors.consent)}
                aria-describedby={
                  errors.consent
                    ? "contact-privacy contact-consent-error"
                    : "contact-privacy"
                }
              />
              <span>개인정보 수집·이용에 동의합니다. (필수)</span>
            </label>
            {errors.consent && (
              <FormFieldMessage id="contact-consent-error" tone="danger">
                {errors.consent}
              </FormFieldMessage>
            )}
            <Button type="submit" size="lg">
              이메일로 문의하기 <ArrowRight size={16} />
            </Button>
            <p
              className="ecoya-contact-email-note"
              role={emailOpened ? "status" : undefined}
            >
              {emailOpened
                ? "이메일 앱에서 보내기를 눌러야 문의가 전달됩니다. 앱이 열리지 않으면 아래 주소로 보내주세요."
                : "작성한 내용으로 이메일 앱이 열립니다."}{" "}
              <a href="mailto:contact@ecoya.kr">contact@ecoya.kr</a>
            </p>
          </form>
        </div>
      </main>
    </LandingShell>
  )
}
