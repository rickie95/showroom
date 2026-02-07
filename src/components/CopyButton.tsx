import { useState } from 'react'

type CopyButtonProps = Readonly<{
  value: string
  label?: string
  className?: string
}>

function CopyButton({ value, label = 'Copy', className }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      globalThis.setTimeout(() => setCopied(false), 1500)
    } catch {
      setCopied(false)
    }
  }

  return (
    <button className={className} type="button" onClick={handleCopy}>
      {copied ? 'Copied' : label}
    </button>
  )
}

export default CopyButton
