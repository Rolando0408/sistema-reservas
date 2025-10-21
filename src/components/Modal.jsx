import React from "react";

export default function Modal({ open, onClose, title, children, footer }) {
  if (!open) return null;
  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal-content">
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="modal-close" onClick={onClose} aria-label="Cerrar">
            ✕
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
      <style>{`
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.45);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        .modal-content {
          background: #fff;
          width: 95%;
          max-width: 720px;
          border-radius: 12px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.2);
          overflow: hidden;
        }
        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          border-bottom: 1px solid #eee;
        }
        .modal-body {
          padding: 16px;
        }
        .modal-footer {
          padding: 12px 16px;
          border-top: 1px solid #eee;
          display: flex;
          gap: 8px;
          justify-content: flex-end;
        }
        .modal-close {
          background: transparent;
          border: none;
          font-size: 18px;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}
