import {toast} from "react-toastify";

export { addTokenToKeplr } from "./addTokenToKeplr"


export const copyToClipboard = async (text: string) => {
    try {
        await navigator.clipboard.writeText(text ?? "");
        toast.success("Copied to clipboard");
    } catch (error) {
        console.log("error", error);
    }
}
