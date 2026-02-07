import { PropsWithChildren, ReactNode } from 'react'

type ModalProps = PropsWithChildren<{
  title: string
  onClose: () => void
  actions?: ReactNode
}>

function Modal({ title, onClose, actions, children }: ModalProps) {
  return (
    <div className="modal-backdrop">
      <dialog className="modal-card" open>
        <div className="modal-header">
          <div>
            <p className="eyebrow">Modal</p>
            <h3>{title}</h3>
          </div>
          <button className="ghost-button" onClick={onClose} type="button">
            Close
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {actions ? <div className="modal-actions">{actions}</div> : null}
      </dialog>
    </div>
  )
}

export default Modal
