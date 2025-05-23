import { useState } from "react";
import { useDropzone } from "react-dropzone";
import { useParams } from "react-router-dom"; // Added useParams
import { axiosInstance } from "../../../common/api/axiosInstance";
import { BackButton } from "@forms/components/BackButton"; // Added import

function FormularioValidacion() {
  const { area, id_proyecto } = useParams(); // Get params
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
    <div> {/* Added a wrapper div */}
      <BackButton area={area} id_proyecto={id_proyecto} /> {/* Added BackButton component with props */}
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
    </div>
  );
}

export { FormularioValidacion };
