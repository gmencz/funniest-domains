import { Dialog } from "@headlessui/react";
import { Form } from "remix";

type Props = {
  open: boolean;
  onClose: () => void;
  description: string;
};

export function LoginDialog({ open, onClose, description }: Props) {
  return (
    <Dialog open={open} onClose={onClose} className="login-dialog">
      <Dialog.Overlay className="login-dialog-overlay" />

      <div className="login-dialog-content">
        <Dialog.Title>Account needed</Dialog.Title>
        <Dialog.Description>{description}</Dialog.Description>

        <Form method="post">
          <div>
            <input
              type="radio"
              id="login"
              name="type"
              value="login"
              defaultChecked
            />
            <label htmlFor="login">Login</label>
          </div>

          <div>
            <input type="radio" id="register" name="type" value="register" />
            <label htmlFor="register">Register</label>
          </div>

          <div className="mt-4 flex-col">
            <label htmlFor="username">Username</label>
            <input type="text" id="username" name="username" />
          </div>

          <div className="mt-2 flex-col">
            <label htmlFor="password">Password</label>
            <input type="password" id="password" name="password" />
          </div>

          <input type="hidden" name="_action" value="login" />

          <div className="mt-4">
            <button type="submit">Submit</button>
          </div>
        </Form>
      </div>
    </Dialog>
  );
}
