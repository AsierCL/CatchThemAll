import {
  useId,
  useState,
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
  hintId?: string
  error?: string
  errorId?: string
  required?: boolean
  children: ReactNode
  className?: string
}

function FieldShell({
  label,
  htmlFor,
  hint,
  hintId,
  error,
  errorId,
  required,
  children,
  className,
}: FieldShellProps) {
  return (
    <div className={cx('space-y-1.5', className)}>
      <label htmlFor={htmlFor} className="flex items-baseline justify-between gap-2">
        <span className="font-pixel text-[0.6875rem] uppercase tracking-[0.06em] text-ink-700">
          {label}
          {required && <span className="ml-1 text-rose-400">*</span>}
        </span>
        {hint && !error && (
          <span id={hintId} className="text-[0.6875rem] text-ink-400">
            {hint}
          </span>
        )}
      </label>
      {children}
      {error && (
        <p id={errorId} className="text-xs text-rose-400">
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

function describedBy(...ids: Array<string | undefined>): string | undefined {
  const value = ids.filter(Boolean).join(' ')
  return value || undefined
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  hint?: string
  error?: string
  containerClassName?: string
  inputRef?: Ref<HTMLInputElement>
  trailing?: ReactNode
}

export function Input({
  label,
  hint,
  error,
  containerClassName,
  className,
  id,
  required,
  inputRef,
  trailing,
  'aria-describedby': ariaDescribedBy,
  ...rest
}: InputProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const hintId = hint ? `${inputId}-hint` : undefined
  const errorId = error ? `${inputId}-error` : undefined

  return (
    <FieldShell
      label={label}
      htmlFor={inputId}
      hint={hint}
      hintId={hintId}
      error={error}
      errorId={errorId}
      required={required}
      className={containerClassName}
    >
      <div className="relative">
        <input
          ref={inputRef}
          id={inputId}
          required={required}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={describedBy(ariaDescribedBy, error ? undefined : hintId, errorId)}
          className={cx(CONTROL, Boolean(trailing) && 'pr-20', error && 'border-rose-400/70', className)}
          {...rest}
        />
        {trailing && <div className="absolute inset-y-0 right-0 flex items-center pr-1">{trailing}</div>}
      </div>
    </FieldShell>
  )
}

type PasswordInputProps = Omit<InputProps, 'type' | 'trailing'>

/** Input de contrasena con un control visible para mostrar u ocultar el valor. */
export function PasswordInput(props: PasswordInputProps) {
  const [visible, setVisible] = useState(false)

  return (
    <Input
      {...props}
      type={visible ? 'text' : 'password'}
      trailing={
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          aria-pressed={visible}
          className="flex h-full items-center px-2 font-pixel text-[0.5625rem] uppercase tracking-[0.04em] text-ink-500 transition-colors hover:text-ink-900"
        >
          {visible ? 'Ocultar' : 'Ver'}
        </button>
      }
    />
  )
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  hint?: string
  error?: string
  containerClassName?: string
}

export function Textarea({
  label,
  hint,
  error,
  containerClassName,
  className,
  id,
  required,
  'aria-describedby': ariaDescribedBy,
  ...rest
}: TextareaProps) {
  const generatedId = useId()
  const textareaId = id ?? generatedId
  const hintId = hint ? `${textareaId}-hint` : undefined
  const errorId = error ? `${textareaId}-error` : undefined

  return (
    <FieldShell
      label={label}
      htmlFor={textareaId}
      hint={hint}
      hintId={hintId}
      error={error}
      errorId={errorId}
      required={required}
      className={containerClassName}
    >
      <textarea
        id={textareaId}
        required={required}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={describedBy(ariaDescribedBy, error ? undefined : hintId, errorId)}
        className={cx(
          CONTROL,
          'min-h-24 max-h-48 resize-y [field-sizing:content]',
          error && 'border-rose-400/70',
          className,
        )}
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

export function Select({
  label,
  hint,
  error,
  containerClassName,
  className,
  id,
  required,
  children,
  'aria-describedby': ariaDescribedBy,
  ...rest
}: SelectProps) {
  const generatedId = useId()
  const selectId = id ?? generatedId
  const hintId = hint ? `${selectId}-hint` : undefined
  const errorId = error ? `${selectId}-error` : undefined

  return (
    <FieldShell
      label={label}
      htmlFor={selectId}
      hint={hint}
      hintId={hintId}
      error={error}
      errorId={errorId}
      required={required}
      className={containerClassName}
    >
      <select
        id={selectId}
        required={required}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={describedBy(ariaDescribedBy, error ? undefined : hintId, errorId)}
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
