import {
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type Ref,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react'
import { cx } from '../../lib/cx'

interface FieldShellProps {
  label: string
  htmlFor: string
  hint?: string
  error?: string
  required?: boolean
  children: ReactNode
  className?: string
}

function FieldShell({ label, htmlFor, hint, error, required, children, className }: FieldShellProps) {
  return (
    <div className={cx('space-y-1.5', className)}>
      <label htmlFor={htmlFor} className="flex items-baseline justify-between gap-2">
        <span className="font-pixel text-[0.6875rem] uppercase tracking-[0.06em] text-ink-700">
          {label}
          {required && <span className="ml-1 text-rose-400">*</span>}
        </span>
        {hint && !error && <span className="text-[0.6875rem] text-ink-400">{hint}</span>}
      </label>
      {children}
      {error && (
        <p role="alert" className="text-xs text-rose-400">
          {error}
        </p>
      )}
    </div>
  )
}

const CONTROL =
  'w-full border-2 border-paper-300 bg-paper-0 px-3 py-2.5 text-base text-ink-900 md:text-sm ' +
  'max-md:min-h-11 placeholder:text-ink-400 transition-colors duration-100 ' +
  'hover:border-paper-400 focus:border-poke-500 focus:outline-none ' +
  'disabled:cursor-not-allowed disabled:border-paper-200 disabled:bg-paper-100 disabled:text-ink-400'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  hint?: string
  error?: string
  containerClassName?: string
  inputRef?: Ref<HTMLInputElement>
}

export function Input({ label, hint, error, containerClassName, className, id, required, inputRef, ...rest }: InputProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId

  return (
    <FieldShell
      label={label}
      htmlFor={inputId}
      hint={hint}
      error={error}
      required={required}
      className={containerClassName}
    >
      <input
        ref={inputRef}
        id={inputId}
        aria-invalid={error ? true : undefined}
        className={cx(CONTROL, error && 'border-rose-400/70', className)}
        {...rest}
      />
    </FieldShell>
  )
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  hint?: string
  error?: string
  containerClassName?: string
}

export function Textarea({ label, hint, error, containerClassName, className, id, required, ...rest }: TextareaProps) {
  const generatedId = useId()
  const textareaId = id ?? generatedId

  return (
    <FieldShell
      label={label}
      htmlFor={textareaId}
      hint={hint}
      error={error}
      required={required}
      className={containerClassName}
    >
      <textarea
        id={textareaId}
        aria-invalid={error ? true : undefined}
        className={cx(CONTROL, 'min-h-24 resize-y', error && 'border-rose-400/70', className)}
        {...rest}
      />
    </FieldShell>
  )
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  hint?: string
  error?: string
  containerClassName?: string
}

export function Select({ label, hint, error, containerClassName, className, id, children, ...rest }: SelectProps) {
  const generatedId = useId()
  const selectId = id ?? generatedId

  return (
    <FieldShell label={label} htmlFor={selectId} hint={hint} error={error} className={containerClassName}>
      <select
        id={selectId}
        className={cx(CONTROL, 'appearance-none bg-[position:right_0.6rem_center] pr-9', className)}
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' shape-rendering='crispEdges'%3E%3Cpath fill='%239a9cba' d='M4 6h8v2H4zM6 8h4v2H6z'/%3E%3C/svg%3E\")",
          backgroundRepeat: 'no-repeat',
        }}
        {...rest}
      >
        {children}
      </select>
    </FieldShell>
  )
}
