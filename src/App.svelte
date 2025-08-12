<script>
  import heic2any from 'heic2any'
  import JSZip from 'jszip'

  let files = []
  let converting = false
  let dragOver = false
  let progress = 0
  let currentFile = ''
  let cancelled = false

  function handleDrop(e) {
    e.preventDefault()
    dragOver = false
    const droppedFiles = Array.from(e.dataTransfer.files).filter(f => 
      f.name.toLowerCase().endsWith('.heic') || f.name.toLowerCase().endsWith('.heif')
    )
    files = [...files, ...droppedFiles]
  }

  function handleDragOver(e) {
    e.preventDefault()
    dragOver = true
  }

  function handleDragLeave() {
    dragOver = false
  }

  async function convertFiles() {
    if (!files.length) return
    
    converting = true
    cancelled = false
    progress = 0
    
    if (files.length === 1) {
      currentFile = files[0].name
      try {
        const jpgBlob = await heic2any({
          blob: files[0],
          toType: 'image/jpeg',
          quality: 0.8
        })
        if (cancelled) return
        progress = 100
        const url = URL.createObjectURL(jpgBlob)
        const a = document.createElement('a')
        a.href = url
        a.download = files[0].name.replace(/\.(heic|heif)$/i, '.jpg')
        a.click()
        URL.revokeObjectURL(url)
      } catch (error) {
        console.error(`Failed to convert ${files[0].name}:`, error)
      }
    } else {
      const zip = new JSZip()
      
      for (let i = 0; i < files.length; i++) {
        if (cancelled) break
        const file = files[i]
        currentFile = file.name
        try {
          const jpgBlob = await heic2any({
            blob: file,
            toType: 'image/jpeg',
            quality: 0.8
          })
          if (cancelled) break
          const fileName = file.name.replace(/\.(heic|heif)$/i, '.jpg')
          zip.file(fileName, jpgBlob)
          progress = Math.round(((i + 1) / files.length) * 100)
        } catch (error) {
          console.error(`Failed to convert ${file.name}:`, error)
        }
      }
      
      if (!cancelled) {
        const zipBlob = await zip.generateAsync({type: 'blob'})
        const url = URL.createObjectURL(zipBlob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'converted-images.zip'
        a.click()
        URL.revokeObjectURL(url)
      }
    }
    
    if (!cancelled) files = []
    converting = false
    progress = 0
    currentFile = ''
  }

  function cancelConversion() {
    cancelled = true
    converting = false
    progress = 0
    currentFile = ''
  }

  function removeFile(index) {
    files = files.filter((_, i) => i !== index)
  }
</script>

<main>
  <h1>HEIC to JPG Converter</h1>
  
  <div 
    class="drop-zone" 
    class:drag-over={dragOver}
    on:drop={handleDrop}
    on:dragover={handleDragOver}
    on:dragleave={handleDragLeave}
  >
    <p>Drop HEIC files here</p>
  </div>

  {#if files.length > 0}
    <div class="file-list">
      {#each files as file, i}
        <div class="file-item">
          <span>{file.name}</span>
          <button on:click={() => removeFile(i)} title="Remove {file.name}" aria-label="Remove {file.name}">×</button>
        </div>
      {/each}
    </div>

    {#if converting}
      <div class="progress-container">
        <div class="progress-bar">
          <div class="progress-fill" style="width: {progress}%"></div>
        </div>
        <p>Converting {currentFile}... {progress}%</p>
      </div>
    {/if}

    <div class="button-group">
      <button 
        class="convert-btn" 
        on:click={convertFiles} 
        disabled={converting}
      >
        {converting ? 'Converting...' : 'Convert & Download'}
      </button>
      
      {#if converting}
        <button class="cancel-btn" on:click={cancelConversion}>
          Cancel
        </button>
      {/if}
    </div>
  {/if}
</main>

<style>
  main {
    max-width: 600px;
    margin: 0 auto;
    padding: 2rem;
    font-family: Arial, sans-serif;
  }

  .drop-zone {
    border: 2px dashed #ccc;
    border-radius: 8px;
    padding: 3rem;
    text-align: center;
    margin: 2rem 0;
    transition: border-color 0.3s;
  }

  .drop-zone.drag-over {
    border-color: #007bff;
    background-color: #f8f9fa;
  }

  .file-list {
    margin: 1rem 0;
  }

  .file-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    margin-bottom: 0.5rem;
  }

  .file-item button {
    color: gray;
    border: none;
    border-radius: 50%;
    width: 24px;
    height: 24px;
    cursor: pointer;
  }

  .convert-btn {
    background: #007bff;
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1rem;
  }

  .convert-btn:disabled {
    background: #6c757d;
    cursor: not-allowed;
  }

  .progress-container {
    margin: 1rem 0;
  }

  .progress-bar {
    width: 100%;
    height: 20px;
    background: #e9ecef;
    border-radius: 10px;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    background: #007bff;
    transition: width 0.3s ease;
  }

  .progress-container p {
    margin: 0.5rem 0 0 0;
    font-size: 0.9rem;
    color: #666;
  }

  .button-group {
    display: flex;
    gap: 0.5rem;
  }

  .cancel-btn {
    background: #dc3545;
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1rem;
  }
</style>