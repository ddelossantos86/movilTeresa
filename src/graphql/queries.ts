import { gql } from '@apollo/client';

export const LOGIN_TUTOR = gql`
  mutation LoginTutorPassword($input: LoginTutorPasswordInput!) {
    loginTutorPassword(input: $input) {
      token
      user {
        id
        documento
        tipo
        nombre
        apellido
      }
      primerLogin
    }
  }
`;

export const GET_MENSAJES_TUTOR = gql`
  query GetMensajesTutor($alumnoId: ID) {
    mensajesTutor(alumnoId: $alumnoId) {
      id
      titulo
      contenido
      tipo
      alcance
      gradoNombre
      divisionNombre
      estado
      autorNombre
      publicadoEn
      creadoEn
      leido
      leidoPorTutorIds
      destinatarioIds
      imagen
      imagenes
    }
  }
`;

export const MARCAR_MENSAJE_LEIDO = gql`
  mutation MarcarMensajeComoLeido($mensajeId: ID!) {
    marcarMensajeComoLeido(mensajeId: $mensajeId) {
      id
      leido
      leidoPorTutorIds
    }
  }
`;

export const GET_ESTADISTICAS_MENSAJE = gql`
  query EstadisticasMensaje($mensajeId: ID!) {
    estadisticasMensaje(mensajeId: $mensajeId) {
      mensajeId
      totalDestinatarios
      totalLeidos
      totalNoLeidos
      porcentajeLeido
      lecturas {
        tutorId
        tutorNombre
        tutorApellido
        alumnoId
        alumnoNombre
        alumnoApellido
        leido
      }
    }
  }
`;

export const GET_ALUMNOS_TUTOR = gql`
  query GetAlumnosTutor {
    alumnosTutor {
      id
      nombre
      apellido
      nivel
      grado
      division
      fechaNacimiento
      condicionesEspeciales
      observacionesCondiciones
    }
  }
`;

export const GET_ASISTENCIAS = gql`
  query GetAsistenciasTutor($alumnoId: ID, $desde: String, $hasta: String) {
    asistenciasTutor(alumnoId: $alumnoId, desde: $desde, hasta: $hasta) {
      id
      fecha
      divisionNombre
      gradoNombre
      registros {
        alumnoId
        estado
        observaciones
      }
    }
  }
`;

export const GET_CALIFICACIONES = gql`
  query GetCalificacionesTutor($alumnoId: ID) {
    calificacionesTutor(alumnoId: $alumnoId) {
      id
      nombre  
      divisionId
      evaluaciones {
        _id
        fecha
        tipo
        tema
        observaciones
        esRecuperatorio
        evaluacionOriginalId
        notas {
          alumnoId
          calificacion {
            tipo
            valorNumerico
            valorConceptual
            aprobado
          }
          observaciones
          estado
        }
      }
    }
  }
`;

export const GET_OBSERVACIONES_INICIAL = gql`
  query GetObservacionesInicialesTutor($alumnoId: ID) {
    observacionesInicialesTutor(alumnoId: $alumnoId) {
      id
      alumnoId
      divisionId
      periodo
      camposFormativos {
        campoFormativoId
        campoFormativoNombre
        logrosAlcanzados
        enDesarrollo
        enRevision
        observaciones
      }
      asistencia {
        presentes
        ausentes
        tardanzas
      }
      observacionesGenerales
      createdAt
    }
  }
`;

export const GET_SEGUIMIENTO_DIARIO = gql`
  query GetSeguimientoDiario($alumnoId: ID!, $fechaInicio: DateTime, $fechaFin: DateTime, $limit: Float) {
    seguimientosDiariosPorAlumnoTutor(alumnoId: $alumnoId, fechaInicio: $fechaInicio, fechaFin: $fechaFin, limit: $limit) {
      id
      alumnoId
      divisionId
      fecha
      estadoDelDia
      alimentacion {
        desayuno
        almuerzo
        merienda
      }
      descanso {
        durmio
        horaDormir
        horaDespertar
        llegoDormido
      }
      cambios {
        pis
        caca
      }
      notasDelDia
      docenteId
      creadoEn
      actualizadoEn
    }
  }
`;

export const GET_TUTOR_INFO = gql`
  query GetTutorInfo {
    tutorInfo {
      id
      documento
      nombre
      apellido
      telefono
      email
    }
  }
`;

export const GET_MENSAJES = gql`
  query GetMensajes($alumnoId: ID) {
    mensajesTutor(alumnoId: $alumnoId) {
      id
      titulo
      contenido
      tipo
      alcance
      autorNombre
      publicadoEn
      creadoEn
      leido
      destinatarioIds
    }
  }
`;

export const SUBSCRIBE_PUSH = gql`
  mutation SubscribePush($subscription: String!) {
    subscribePush(subscription: $subscription)
  }
`;

export const UPDATE_TUTOR_PROFILE = gql`
  mutation UpdateTutorProfile($id: ID!, $input: UpdateTutorInput!) {
    updateTutor(id: $id, input: $input) {
      id
      nombre
      apellido
      telefono
      email
    }
  }
`;

export const UPDATE_ALUMNO_CONDICIONES = gql`
  mutation UpdateAlumnoCondiciones($id: ID!, $input: UpdateAlumnoInput!) {
    updateAlumnoCondicionesTutor(id: $id, input: $input) {
      id
      nombre
      apellido
      fechaNacimiento
      condicionesEspeciales
      observacionesCondiciones
    }
  }
`;

export const UPDATE_PUSH_TOKEN = gql`
  mutation UpdatePushToken($token: String!) {
    updateTutorPushToken(token: $token) {
      id
      pushToken
    }
  }
`;

export const TOGGLE_MENSAJE_REACCION = gql`
  mutation ToggleMensajeReaccion($mensajeId: ID!, $tipo: String!) {
    toggleMensajeReaccion(mensajeId: $mensajeId, tipo: $tipo) {
      id
      mensajeId
      tutorId
      tipo
      creadoEn
    }
  }
`;

// DISABLED: This query field 'reaccionesMensaje' doesn't exist in the backend
// It was causing constant 400 errors on every Dashboard load
/*
export const GET_REACCIONES_MENSAJE = gql`
  query GetReaccionesMensaje($mensajeId: ID!) {
    reaccionesMensaje(mensajeId: $mensajeId) {
      id
      mensajeId
      tutorId
      tutorNombre
      tipo
      creadoEn
    }
  }
`;
*/

// DEPRECATED: Este resolver no existe en el backend
// export const GET_CONTADOR_REACCIONES = gql`
//   query GetContadorReacciones($mensajeId: ID!) {
//     contadorReacciones(mensajeId: $mensajeId) {
//       mensajeId
//       totalReacciones
//       reaccionesPorTipo {
//         tipo
//         cantidad
//       }
//       miReaccion
//     }
//   }
// `;
