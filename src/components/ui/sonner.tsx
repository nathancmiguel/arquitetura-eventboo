import { Toaster as Sonner, type ToasterProps } from "sonner";

// Toaster do shadcn (Sonner) com os tokens da paleta. Tema único claro.
function Toaster(props: ToasterProps) {
	return (
		<Sonner
			theme="light"
			position="bottom-right"
			className="toaster group"
			toastOptions={{
				classNames: {
					toast:
						"!rounded-[5px] !border !border-linha-forte !bg-paper !text-ink !shadow-none !font-sans",
					title: "!text-sm !font-bold",
					description: "!text-muted-foreground",
					error: "!border-l-4 !border-l-vinho-2",
					success: "!border-l-4 !border-l-vinho",
				},
			}}
			{...props}
		/>
	);
}

export { Toaster };
