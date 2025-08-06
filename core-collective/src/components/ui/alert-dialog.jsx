import * as React from "react";
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";

export function AlertDialog({ open, onOpenChange, title, description, onConfirm, onCancel, confirmText = "Delete", cancelText = "Cancel" }) {
  return (
    <AlertDialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialogPrimitive.Portal>
        <AlertDialogPrimitive.Overlay className="alert-dialog-overlay" />
        <AlertDialogPrimitive.Content className="alert-dialog-content">
          <AlertDialogPrimitive.Title className="alert-dialog-title">{title}</AlertDialogPrimitive.Title>
          <AlertDialogPrimitive.Description className="alert-dialog-description">{description}</AlertDialogPrimitive.Description>
          <div className="alert-dialog-actions">
            <AlertDialogPrimitive.Cancel asChild>
              <button className="alert-dialog-cancel" onClick={onCancel}>{cancelText}</button>
            </AlertDialogPrimitive.Cancel>
            <AlertDialogPrimitive.Action asChild>
              <button className="alert-dialog-confirm" onClick={onConfirm}>{confirmText}</button>
            </AlertDialogPrimitive.Action>
          </div>
        </AlertDialogPrimitive.Content>
      </AlertDialogPrimitive.Portal>
    </AlertDialogPrimitive.Root>
  );
}

// Basic styles (add to your CSS or use a CSS-in-JS solution)
// .alert-dialog-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.2); z-index: 1000; }
// .alert-dialog-content { background: #fff; border-radius: 8px; padding: 2rem; max-width: 400px; margin: 10% auto; box-shadow: 0 2px 16px rgba(0,0,0,0.2); z-index: 1001; }
// .alert-dialog-title { font-size: 1.2rem; font-weight: bold; margin-bottom: 0.5rem; }
// .alert-dialog-description { margin-bottom: 1.5rem; }
// .alert-dialog-actions { display: flex; justify-content: flex-end; gap: 1rem; }
// .alert-dialog-cancel, .alert-dialog-confirm { padding: 0.5rem 1.2rem; border-radius: 4px; border: none; cursor: pointer; }
// .alert-dialog-cancel { background: #eee; color: #333; }
// .alert-dialog-confirm { background: #e53e3e; color: #fff; }
