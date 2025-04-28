"use client";

export default function UploadFileButton({ tenant }: { tenant: { slug: string } }) {
  const handleUpload = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.multiple = true;
    input.click();
    input.onchange = async (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files && files.length > 0) {
        // TODO: Implement file upload logic
        console.log("Files to upload:", files);
      }
    };
  };

  const handleFileUpload = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/ragie/upload", {
      method: "POST",
      headers: {
        tenant: tenant.slug,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Failed to upload file");
    }

    const result = await response.json();
    return result;
  };

  return (
    <button
      className="flex items-center rounded-[40px] h-[40px] px-5 bg-[#F5F5F7] border border-[#D7D7D7] font-semibold"
      onClick={handleUpload}
    >
      <div className="mr-2">Upload File</div>
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M8 4L8 12M8 4L5 7M8 4L11 7"
          stroke="#1C1B1F"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
