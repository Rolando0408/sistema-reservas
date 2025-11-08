# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Troubleshooting on Windows (PowerShell)

If you see an error like:

> No se puede cargar el archivo C:\\Program Files\\nodejs\\npm.ps1 porque la ejecución de scripts está deshabilitada en este sistema

PowerShell is blocking script execution. Fix it safely for your user only:

1. Open PowerShell as your normal user (no admin required).
2. Run:

	```powershell
	Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned -Force
	```

3. Verify:

	```powershell
	Get-ExecutionPolicy -List
	```

	You should see `CurrentUser: RemoteSigned`.

4. Try again:

	```powershell
	npm install
	npm run dev
	```

Alternative: run commands from "Command Prompt" (cmd.exe), which uses `npm.cmd` and isn't affected by PowerShell's policy.
