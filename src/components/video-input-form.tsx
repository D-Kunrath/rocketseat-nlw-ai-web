import { FileVideo, Upload } from "lucide-react";
import { Separator } from "./ui/separator";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { ChangeEvent, FormEvent, useMemo, useRef, useState } from "react";
import { getFFmpeg } from "@/lib/ffmpeg";
import { fetchFile } from '@ffmpeg/util'

export function VideoInputForm () {
  const [ videoFile, setVideoFile ] = useState<File | null>(null);
  const promptInputRef = useRef<HTMLTextAreaElement>(null);

  function handleFileSelected(e: ChangeEvent<HTMLInputElement>) {
    const { files } = e.currentTarget;

    if (!files) return;

    const selectedFile = files[0];

    setVideoFile(selectedFile);
  }

  async function convertVideoToAudio(video: File) {
    console.log('Convert started.');

    const ffmpeg = await getFFmpeg();

    console.log('fetching...')
    await ffmpeg.writeFile('input.mp4', await fetchFile(video));

    ffmpeg.on('progress', progress => {
      console.log(`Convert progress: ${Math.round(progress.progress) * 100}%`);
    })

    console.log('executing...')
    await ffmpeg.exec([
      '-i',
      'input.mp4',
      '-map',
      '0:a',
      '-b:a',
      '20k',
      '-acodec',
      'libmp3lame',
      'output.mp3'
    ])

    console.log('reading...')
    const data = await ffmpeg.readFile('output.mp3');
    
    console.log('creating file...')
    const audioFileBlob = new Blob([data], { type: 'audio/mpeg' });
    const audioFile = new File([audioFileBlob], 'audio.mp3', { type: 'audio/mpeg' });

    console.log('Convert finished.')

    return audioFile;
  }

  async function handleUploadVideo(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const prompt = promptInputRef.current?.value;

    if (!videoFile) return;

    const audioFile = await convertVideoToAudio(videoFile);

    console.log(audioFile, prompt);
  }

  const previewURL = useMemo(() => {
    if(!videoFile) return null;

    return URL.createObjectURL(videoFile);
  }, [videoFile])

  return (
    <form className="space-y-6" onSubmit={handleUploadVideo}>
    <label
      htmlFor="video"
      className="relative border flex rounded-md aspect-video cursor-pointer border-dashed text-sm flex-col gap-2 items-center justify-center text-muted-foreground hover:bg-primary/5"
    >
      {previewURL ? (
        <video src={previewURL} controls={false} className="pointer-events-none absolute inset-0" />
      ) : (
        <>
          <FileVideo className="w-4 h-4" />
          Selecione vídeo
        </>
      )}
    </label>
    <input type="file" id="video" accept="video/mp4" className="sr-only" onChange={handleFileSelected} />

    <Separator />

    <div className="space-y-2">
      <Label htmlFor="trancription_prompt">Promp de transcrição</Label>
      <Textarea
        ref={promptInputRef}
        id="transciption_prompt"
        className="h-20 leading-relaxed resize-none"
        placeholder="Inclua palavras-chave mencionadas no video spearadas por vírgula (,)"
      />
    </div>

    <Button type="submit" className="w-full">
      Carregar vídeo
      <Upload className="w-4 h-4 ml-2"/>
    </Button>
  </form>
  )
}