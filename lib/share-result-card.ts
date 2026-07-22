export type ShareCardOutcome = "downloaded";

interface ShareCardOptions {
  fileName: string;
}

export async function shareResultCard(
  element: HTMLElement,
  { fileName }: ShareCardOptions
): Promise<ShareCardOutcome> {
  const timeout = (milliseconds: number) =>
    new Promise<void>((resolve) => window.setTimeout(resolve, milliseconds));

  await Promise.race([document.fonts?.ready ?? Promise.resolve(), timeout(1500)]);

  const images = Array.from(element.querySelectorAll("img"));
  await Promise.race([
    Promise.all(
      images.map((image) =>
        image.complete
          ? image.decode().catch(() => undefined)
          : new Promise<void>((resolve) => {
              image.addEventListener("load", () => resolve(), { once: true });
              image.addEventListener("error", () => resolve(), { once: true });
            })
      )
    ).then(() => undefined),
    timeout(2000),
  ]);

  const html2canvas = (await import("html2canvas")).default;
  const canvas = await html2canvas(element, {
    backgroundColor: null,
    useCORS: true,
    logging: false,
    scale: 2,
    onclone: (clonedDocument) => {
      clonedDocument.querySelectorAll<HTMLElement>("[data-capture-label]").forEach((label) => {
        label.textContent = "다운로드 완료";
      });
    },
  });

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (value) => (value ? resolve(value) : reject(new Error("이미지를 만들지 못했습니다."))),
      "image/png",
      0.96
    );
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  return "downloaded";
}
