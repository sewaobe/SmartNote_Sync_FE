import api from './axiosClient';

/**
 * Update current page index for a lecture
 * @param {string} lectureId - The lecture ID
 * @param {number} currentPageIndex - The page index to update (0-based)
 * @returns {Promise} Response from server
 */
export const updateCurrentPageIndex = async (lectureId, currentPageIndex) => {
  try {
    const response = await api.put(`/transcription/${lectureId}/currentPageIndex`, {
      currentPageIndex,
    });
    return response;
  } catch (error) {
    console.error('Error updating current page index:', error);
    throw error;
  }
};

/**
 * Get current page index for a lecture
 * Returns currentPageIndex if there's a queued transcript, otherwise returns -1
 * @param {string} lectureId - The lecture ID
 * @returns {Promise<{currentPageIndex: number, lecture_id: string}>}
 */
export const getCurrentPageIndex = async (lectureId) => {
  try {
    const response = await api.get(`/transcription/${lectureId}/currentPageIndex`);
    return response.data || response;
  } catch (error) {
    console.error('Error getting current page index:', error);
    throw error;
  }
};

/**
 * Start transcription for a lecture
 * @param {string} lectureId - The lecture ID
 * @returns {Promise} Response with transcript_id
 */
export const startTranscription = async (lectureId) => {
  try {
    const response = await api.post(`/transcription/start/${lectureId}`);
    return response;
  } catch (error) {
    console.error('Error starting transcription:', error);
    throw error;
  }
};

/**
 * Upload audio file for transcription
 * @param {string} transcriptId - The transcript ID
 * @param {File|Blob} audioFile - The audio file to upload
 * @returns {Promise} Response from server
 */
export const uploadTranscription = async (transcriptId, audioFile) => {
  try {
    const formData = new FormData();
    formData.append('audio', audioFile);

    const response = await api.post(`/transcription/upload/${transcriptId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response;
  } catch (error) {
    console.error('Error uploading transcription:', error);
    throw error;
  }
};

/**
 * Get all transcripts for a lecture
 * @param {string} lectureId - The lecture ID
 * @returns {Promise} Array of transcripts
 */
export const getLectureTranscripts = async (lectureId) => {
  try {
    const response = await api.get(`/transcription/lecture/${lectureId}`);
    return response.data || response;
  } catch (error) {
    console.error('Error getting lecture transcripts:', error);
    throw error;
  }
};
