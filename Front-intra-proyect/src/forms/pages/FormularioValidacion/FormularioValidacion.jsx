import { useState } from "react";
import { useDropzone } from "react-dropzone";
import { axiosInstance } from "../../../common/api/axiosInstance";

function FormularioValidacion() {
  const [files, setFiles] = useState([]);
  const { getRootProps, getInputProps } = useDropzone({
    onDrop: (acceptedFiles) => {
      const file = acceptedFiles[0];
      setFiles((prevFiles) => [...prevFiles, file]);

      uploadFile(file);
    },
  });

  const uploadFile = async (file) => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axiosInstance.post("api/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      console.log("File uploaded successfully:", response.data);
    } catch (error) {
      console.error("Error uploading file:", error);
    }
  };

  return (
    <div {...getRootProps()} className="dropzone">
      <input {...getInputProps()} />
      <p>Arrastra y suelta un archivo aquí, o haz clic para seleccionar uno</p>
      <ul>
        {/* {files.map((file, index) => (
          <li key={index}>{file.name}</li>
        ))} */}
        {files.map((file, index) => (
          <li key={index}>
            {file.type.startsWith("image/") ? (
              <img
                src={URL.createObjectURL(file)}
                alt={file.name}
                width="100"
              />
            ) : (
              <p>{file.name}</p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export { FormularioValidacion };
