import { useCallback, useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useParams } from "react-router-dom"; // Added useParams
import { axiosInstance } from "../../../common/api/axiosInstance";
import { BackButton } from "@forms/components/BackButton"; // Added import
import "./FormularioValidacion.css"; // Import CSS for styling
import Swal from "sweetalert2";

function FormularioValidacion() {
  const { area, id_proyecto } = useParams(); // Get params
  const [files, setFiles] = useState([]);

  const onDropAccepted = useCallback((files) => {
    // se implementa como primer intento la preview de los archivos
    // esta preview inicial es la que se genera cuando el input acepta el archivo
    // esta preview debería mostrar una vista previa del archivo y un botón para guardar
    // el archivo en el servidor, opcionalmente un botón para cancelar

    const previews = files.map((file) => {
      const preview = URL.createObjectURL(file);
      return Object.assign(file, { preview });
    });
    setFiles(previews);
  }, []);

  useEffect(() => {
    return () => files.forEach((file) => URL.revokeObjectURL(file.preview));
  }, [files]);

  const onDropRejected = useCallback((rejectedFiles) => {
    Toast.fire({
      icon: "error",
      title: `Error al guardar el presupuesto: ${
        rejectedFiles[0]?.errors[0]?.message || "Archivo no permitido"
      }`,
    });
    console.log("Rejected files:", rejectedFiles);
    // comando para ignorar el error
  }, []);

  /* const onDropAccepted = (acceptedFiles) => {
    const file = acceptedFiles[0];
    setFiles((prevFiles) => [...prevFiles, file]);

    uploadFile(file);
  }; */

  const Toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    didOpen: (toast) => {
      toast.onmouseenter = Swal.stopTimer;
      toast.onmouseleave = Swal.resumeTimer;
    },
  });

  // Se implementa sistema de feedback visual para el usuario,
  // el cuál se activa si el usuario arrastra un archivo no aceptado segun los parametros del useDropzone

  const { getRootProps, getInputProps, isDragActive, isDragReject, open } =
    useDropzone({
      accept: {
        "image/*": [".jpeg", ".png", ".jpg"],
        "application/pdf": [".pdf"],
      }, // Accept images and PDFs
      onDropAccepted,
      onDropRejected,
      noClick: true, // Prevent click to open file dialog
    });

  // se podría definir una función para manejar la validación de tipos de archivos y sus respectivos limites para usar en el useDropzone
  /* const typeValidator = (file) => {
  if (file.type.startsWith('video/') && file.size > 10 * 1024 * 1024) {
    return { code: 'size-too-large', message: 'Video supera 10MB' };
  }
  if (file.type.startsWith('image/') && file.size > 3 * 1024 * 1024) {
    return { code: 'size-too-large', message: 'Imagen supera 3MB' };
  }
  return null; // sin error
}; */

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
    <div className="project-planning-container">
      <BackButton area={area} id_proyecto={id_proyecto} />{" "}
      <header className="form-header">
        <h1> Validación </h1>
        <div className="form-code">SIGAR-2025</div>
      </header>{" "}
      {/* Added a wrapper div */}
      {/* Added BackButton component with props */}
      <div
        {...getRootProps()}
        className={`dropzone ${isDragReject ? "drag-reject" : ""} ${
          isDragActive ? "drag-active" : ""
        } `}
      >
        <input {...getInputProps()} />
        {!files &&
          isDragActive ? (
            isDragReject ? (
              <p>Archivo no permitido!</p>
            ) : (
              <p>sueltalo!</p>
            )
          ) : (
            <div>
              <button onClick={open}>
                Haz click para seleccionar una imagen o archivo
              </button>
              <p>O arrastra y suelta un archivo aquí</p>
            </div>
          )}
      </div>
      <div className="file-preview">
        {files &&
          files.map((file, index) =>
            file.type.startsWith("image") ? (
              <img src={file.preview} alt={file.name} key={index} width="300" />
            ) : (
              <iframe
                src={file.preview}
                title={file.name}
                key={index}
                width="300"
                height="300"
              ></iframe>
            )
          )}
      </div>
      {files.length > 0 && (
        <>
          <button>Subir archivos</button>
          <button>Cancelar</button>
        </>
      )}
    </div>
  );
}

export { FormularioValidacion };
