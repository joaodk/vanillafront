import { useCallback, useMemo, useState, useEffect } from "react";
import { pipeline, env } from "@xenova/transformers";

// --- Start of Constants.ts content ---
function mobileTabletCheck() {
    let check = false;
    (function (a: string) {
        if (
            /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(
                a,
            ) ||
            /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(
                a.substr(0, 4),
            )
        )
            check = true;
    })(
        navigator.userAgent ||
            navigator.vendor ||
            ("opera" in window && typeof window.opera === "string"
                ? window.opera
                : ""),
    );
    return check;
}
const isMobileOrTablet = mobileTabletCheck();
const Constants = {
    SAMPLING_RATE: 16000,
    DEFAULT_AUDIO_URL: `https://huggingface.co/datasets/Xenova/transformers.js-docs/resolve/main/${
        isMobileOrTablet ? "jfk" : "ted_60_16k"
    }.wav`,
    DEFAULT_MODEL: "Xenova/whisper-tiny",
    DEFAULT_SUBTASK: "transcribe",
    DEFAULT_LANGUAGE: "english",
    DEFAULT_QUANTIZED: isMobileOrTablet,
    DEFAULT_MULTILINGUAL: false,
};
// --- End of Constants.ts content ---

// --- Start of useWorker.ts content ---
interface MessageEventHandler {
    (event: MessageEvent): void;
}

function createWorker(messageEventHandler: MessageEventHandler): Worker {
    // IMPORTANT: The path to worker.js is relative to the *public* directory or the root of the project
    // when bundled by Vite. Since AudioTranscriber.tsx is in src/components, and worker.js is in src/,
    // the relative path from the component to the worker is still correct if the worker is moved to the root.
    // However, for a reusable component, it's often better to place the worker in the public folder
    // or ensure the path is absolute from the root. For this project structure, `../worker.js`
    // from `src/components/AudioTranscriber.tsx` points to `src/worker.js`.
    // If `src/worker.js` is moved to the root of the new project, this path will need adjustment.
    // For now, we assume `src/worker.js` will be copied to the same relative location in the new project.
    const worker = new Worker(new URL("../../public/workers/worker.js", import.meta.url), {
        type: "module",
    });
    worker.addEventListener("message", messageEventHandler);
    return worker;
}

function useWorker(messageEventHandler: MessageEventHandler): Worker {
    const [worker] = useState(() => createWorker(messageEventHandler));
    return worker;
}
// --- End of useWorker.ts content ---


interface ProgressItem {
    file: string;
    loaded: number;
    progress: number;
    total: number;
    name: string;
    status: string;
}

interface TranscriberUpdateData {
    data: [
        string,
        { chunks: { text: string; timestamp: [number, number | null] }[] },
    ];
    text: string;
}

interface TranscriberCompleteData {
    data: {
        text: string;
        chunks: { text: string; timestamp: [number, number | null] }[];
    };
}

export interface TranscriberData {
    isBusy: boolean;
    text: string;
    chunks: { text: string; timestamp: [number, number | null] }[];
}

interface AudioTranscriberProps {
    audioData: AudioBuffer | undefined;
    onTranscript: (data: TranscriberData) => void;
    model?: string;
    multilingual?: boolean;
    quantized?: boolean;
    subtask?: string;
    language?: string;
    onBusyChange?: (isBusy: boolean) => void;
    onModelLoadingChange?: (isModelLoading: boolean) => void;
    onProgressItemsChange?: (progressItems: ProgressItem[]) => void;
}

export const AudioTranscriber: React.FC<AudioTranscriberProps> = ({
    audioData,
    onTranscript,
    model: propModel,
    multilingual: propMultilingual,
    quantized: propQuantized,
    subtask: propSubtask,
    language: propLanguage,
    onBusyChange,
    onModelLoadingChange,
    onProgressItemsChange,
}) => {
    const [transcript, setTranscript] = useState<TranscriberData | undefined>(
        undefined,
    );
    const [isBusy, setIsBusy] = useState(false);
    const [isModelLoading, setIsModelLoading] = useState(false);
    const [progressItems, setProgressItems] = useState<ProgressItem[]>([]);

    // Internal state for transcriber options, allowing props to override defaults
    const [model, setModel] = useState<string>(propModel ?? Constants.DEFAULT_MODEL);
    const [subtask, setSubtask] = useState<string>(propSubtask ?? Constants.DEFAULT_SUBTASK);
    const [quantized, setQuantized] = useState<boolean>(
        propQuantized ?? Constants.DEFAULT_QUANTIZED,
    );
    const [multilingual, setMultilingual] = useState<boolean>(
        propMultilingual ?? Constants.DEFAULT_MULTILINGUAL,
    );
    const [language, setLanguage] = useState<string>(
        propLanguage ?? Constants.DEFAULT_LANGUAGE,
    );

    // Update internal state if props change
    useEffect(() => { if (propModel !== undefined) setModel(propModel); }, [propModel]);
    useEffect(() => { if (propSubtask !== undefined) setSubtask(propSubtask); }, [propSubtask]);
    useEffect(() => { if (propQuantized !== undefined) setQuantized(propQuantized); }, [propQuantized]);
    useEffect(() => { if (propMultilingual !== undefined) setMultilingual(propMultilingual); }, [propMultilingual]);
    useEffect(() => { if (propLanguage !== undefined) setLanguage(propLanguage); }, [propLanguage]);


    const webWorker = useWorker((event) => {
        const message = event.data;
        switch (message.status) {
            case "progress":
                setProgressItems((prev) =>
                    prev.map((item) => {
                        if (item.file === message.file) {
                            return { ...item, progress: message.progress };
                        }
                        return item;
                    }),
                );
                break;
            case "update":
                const updateMessage = message as TranscriberUpdateData;
                setTranscript({
                    isBusy: true,
                    text: updateMessage.data[0],
                    chunks: updateMessage.data[1].chunks,
                });
                break;
            case "complete":
                const completeMessage = message as TranscriberCompleteData;
                setTranscript({
                    isBusy: false,
                    text: completeMessage.data.text,
                    chunks: completeMessage.data.chunks,
                });
                setIsBusy(false);
                break;
            case "initiate":
                setIsModelLoading(true);
                setProgressItems((prev) => [...prev, message]);
                break;
            case "ready":
                setIsModelLoading(false);
                break;
            case "error":
                setIsBusy(false);
                alert(
                    `${message.data.message} This is most likely because you are using Safari on an M1/M2 Mac. Please try again from Chrome, Firefox, or Edge.\n\nIf this is not the case, please file a bug report.`,
                );
                break;
            case "done":
                setProgressItems((prev) =>
                    prev.filter((item) => item.file !== message.file),
                );
                break;
            default:
                break;
        }
    });

    const postRequest = useCallback(
        async (audioData: AudioBuffer | undefined) => {
            if (audioData) {
                setTranscript(undefined);
                setIsBusy(true);

                let audio;
                if (audioData.numberOfChannels === 2) {
                    const SCALING_FACTOR = Math.sqrt(2);
                    let left = audioData.getChannelData(0);
                    let right = audioData.getChannelData(1);
                    audio = new Float32Array(left.length);
                    for (let i = 0; i < audioData.length; ++i) {
                        audio[i] = SCALING_FACTOR * (left[i] + right[i]) / 2;
                    }
                } else {
                    audio = audioData.getChannelData(0);
                }

                webWorker.postMessage({
                    audio,
                    model,
                    multilingual,
                    quantized,
                    subtask: multilingual ? subtask : null,
                    language:
                        multilingual && language !== "auto" ? language : null,
                });
            }
        },
        [webWorker, model, multilingual, quantized, subtask, language],
    );

    // Trigger transcription when audioData prop changes
    useEffect(() => {
        if (audioData) {
            postRequest(audioData);
        }
    }, [audioData, postRequest]);

    // Call onTranscript when transcription is complete
    useEffect(() => {
        if (transcript && !transcript.isBusy) {
            onTranscript(transcript);
        }
    }, [transcript, onTranscript]);

    // Call external callbacks for status changes
    useEffect(() => { onBusyChange?.(isBusy); }, [isBusy, onBusyChange]);
    useEffect(() => { onModelLoadingChange?.(isModelLoading); }, [isModelLoading, onModelLoadingChange]);
    useEffect(() => { onProgressItemsChange?.(progressItems); }, [progressItems, onProgressItemsChange]);

    // The component itself doesn't render anything visible, it's a logic component
    return null;
};
