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

  const onDropAccepted = useCallback((acceptedFiles) => {
    const newFilesWithPreviews = acceptedFiles.map((file) =>
      Object.assign(file, {
        preview: URL.createObjectURL(file),
        // Ensure a unique ID for each file, for React keys and removal
        id: `${file.name}-${file.lastModified}-${file.size}-${Math.random()
          .toString(36)
          .substring(2, 9)}`,
      })
    );
    setFiles((prevFiles) => [...prevFiles, ...newFilesWithPreviews]);
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
      Toast.fire({
        icon: "success",
        title: `${file.name} subido correctamente.`,
      });
      return { success: true, fileName: file.name };
    } catch (error) {
      console.error("Error uploading file:", error);
      Toast.fire({
        icon: "error",
        title: `Error al subir ${file.name}: ${error.message}`,
      });
      return { success: false, fileName: file.name };
    }
  };

  const handleSaveAllFiles = async () => {
    if (files.length === 0) {
      Toast.fire({ icon: "info", title: "No hay archivos para subir." });
      return;
    }

    Swal.fire({
      title: `¿Subir ${files.length} archivo(s)?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "var(--color-primary)",
      cancelButtonColor: "var(--color-secondary)",
      confirmButtonText: "Sí, subir",
      cancelButtonText: "No, cancelar",
    }).then(async (result) => {
      if (result.isConfirmed) {
        let successCount = 0;
        let errorCount = 0;
        const totalFiles = files.length;

        // Show progress
        Swal.fire({
          title: "Subiendo archivos...",
          html: `Subiendo <b>0</b> de <b>${totalFiles}</b> archivos.`,
          timerProgressBar: true,
          didOpen: () => {
            Swal.showLoading();
          },
          allowOutsideClick: false,
          allowEscapeKey: false,
        });

        for (let i = 0; i < totalFiles; i++) {
          const file = files[i];
          Swal.update({
            html: `Subiendo <b>${i + 1}</b> de <b>${totalFiles}</b> archivos: ${
              file.name
            }`,
          });
          const uploadResult = await uploadFile(file);
          if (uploadResult.success) {
            successCount++;
          } else {
            errorCount++;
          }
        }

        Swal.close(); // Close progress Swal

        if (errorCount === 0 && successCount > 0) {
          Swal.fire(
            "¡Subido!",
            `${successCount} archivo(s) subido(s) correctamente.`,
            "success"
          );
          setFiles([]); // Clear files after successful upload
        } else if (successCount > 0 && errorCount > 0) {
          Swal.fire(
            "Parcialmente completado",
            `${successCount} archivo(s) subido(s), ${errorCount} con errores.`,
            "warning"
          );
        } else if (errorCount > 0 && successCount === 0) {
          Swal.fire(
            "Error",
            `No se pudo subir ninguno de los ${errorCount} archivo(s).`,
            "error"
          );
        } else {
          Swal.fire("Información", `No se procesaron archivos.`, "info");
        }
      }
    });
  };

  const handleCancelUpload = () => {
    if (files.length > 0) {
      Swal.fire({
        title: "¿Estás seguro?",
        text: "Se quitarán todos los archivos seleccionados.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "var(--color-primary)",
        cancelButtonColor: "#aaa",
        confirmButtonText: "Sí, cancelar todo",
        cancelButtonText: "No, mantener",
      }).then((result) => {
        if (result.isConfirmed) {
          setFiles([]);
          Toast.fire({ icon: "info", title: "Archivos eliminados." });
        }
      });
    }
  };

  const removeFile = (fileIdToRemove) => {
    const fileToRemove = files.find((f) => f.id === fileIdToRemove);
    if (fileToRemove) {
      URL.revokeObjectURL(fileToRemove.preview); // Important for memory management
    }
    setFiles((prevFiles) =>
      prevFiles.filter((file) => file.id !== fileIdToRemove)
    );
  };

  return (
    <div className="project-planning-container">
      <BackButton area={area} id_proyecto={id_proyecto} />
      <header className="form-header">
        <h1> Validación </h1>
        <div className="form-code">SIGAR-2025</div>
      </header>
      <div
        {...getRootProps()}
        className={`dropzone ${isDragReject ? "drag-reject" : ""} ${
          isDragActive ? "drag-active" : ""
        } ${files.length > 0 ? "has-files" : ""}`}
      >
        <input {...getInputProps()} />
        {files.length === 0 && !isDragActive && (
          <div className="dropzone-empty-content">
            <button
              type="button"
              onClick={open}
              className="select-files-button"
            >
              Haz click para seleccionar archivos
            </button>
            <p>O arrastra y suelta archivos aquí</p>
            <small>(Imágenes JPG, PNG, JPEG y PDFs)</small>
          </div>
        )}
        {isDragActive && !isDragReject && (
          <p className="dropzone-feedback-text">¡Suelta los archivos aquí!</p>
        )}
        {isDragActive && isDragReject && (
          <p className="dropzone-feedback-text drag-reject-text">
            ¡Archivo no permitido!
          </p>
        )}

        {files.length > 0 && !isDragActive && (
          <div className="file-previews-grid">
            {files.map((file) => (
              <div key={file.id} className={`preview-item ${file.type.startsWith("image/") ? "preview-item-image" : "preview-item-pdf"}`}>
                {file.type.startsWith("image/") ? (
                  <img
                    src={file.preview}
                    alt={`Vista previa de ${file.name}`}
                    className="preview-image"
                    onLoad={() => URL.revokeObjectURL(file.preview)} // Revoke after load for img
                  />
                ) : (
                  <div className="preview-pdf-container">
                    <iframe
                      src={file.preview}
                      title={`Vista previa de ${file.name}`}
                      className="preview-iframe"
                    ></iframe>
                    <p className="preview-filename-pdf">{file.name}</p>
                  </div>
                )}
                <button
                  type="button"
                  className="remove-file-button"
                  onClick={() => removeFile(file.id)}
                  title="Eliminar archivo"
                >
                  &times;
                </button>
                <p className="preview-filename">{file.name}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {files.length > 0 && (
        <div className="action-buttons-container">
          <button
            type="button"
            onClick={handleSaveAllFiles}
            className="save-button"
          >
            Guardar Archivos ({files.length})
          </button>
          <button
            type="button"
            onClick={handleCancelUpload}
            className="cancel-button"
          >
            Cancelar Todo
          </button>
        </div>
      )}
    </div>
  );
}

export { FormularioValidacion };
