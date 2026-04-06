const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const fs = require('fs');

ffmpeg.setFfmpegPath(ffmpegPath);

/**
 * Applies filters and processing to a video.
 */
function applyVideoFilters(inputPath, outputPath, options, event) {
    const { type, audioPath, bypassOptions = {}, logoPath } = options;
    return new Promise((resolve) => {
        let command = ffmpeg(inputPath);
        let filterComplex = [];
        let inputCount = 1;

        if (logoPath && fs.existsSync(logoPath)) {
            command.input(logoPath);
            inputCount++;
        }

        if (type === 'blur-bg') {
            filterComplex.push('[0:v]scale=1920:1080:force_original_aspect_ratio=increase,boxblur=20:10,setsar=1[bg]');
            filterComplex.push('[0:v]scale=-1:1080[fg]');
            filterComplex.push('[bg][fg]overlay=(W-w)/2:0[outv]');
        } else if (type === 'bypass' || (Object.keys(bypassOptions).length > 0)) {
            let filters = [];
            if (bypassOptions.hflip) filters.push('hflip');
            if (bypassOptions.color) filters.push('eq=brightness=0.02:contrast=1.05:saturation=1.1');
            if (bypassOptions.zoom) filters.push('scale=iw*1.1:-1,crop=iw/1.1:ih/1.1');
            if (bypassOptions.noise) filters.push('noise=alls=5:allf=t+u');
            
            let vFilter = filters.length > 0 ? filters.join(',') : 'copy';
            
            if (bypassOptions.speed) {
                command.outputOptions(['-filter:a', 'atempo=1.03']);
                vFilter += (vFilter !== 'copy' ? ',' : '') + 'setpts=0.97*PTS';
            }
            filterComplex.push(`[0:v]${vFilter}[v_processed]`);
            
            if (logoPath && fs.existsSync(logoPath)) {
                filterComplex.push(`[v_processed][1:v]overlay=W-w-20:20[outv]`);
            } else {
                filterComplex[filterComplex.length - 1] = filterComplex[filterComplex.length - 1].replace('[v_processed]', '[outv]');
            }
        } else {
            if (logoPath && fs.existsSync(logoPath)) {
                filterComplex.push(`[0:v][1:v]overlay=W-w-20:20[outv]`);
            } else {
                filterComplex.push('[0:v]copy[outv]');
            }
        }

        command.complexFilter(filterComplex, 'outv');

        if (type === 'merge-audio') {
            if (!audioPath) return resolve({ success: false, error: 'Thiếu file âm thanh.' });
            command.input(audioPath);
            command.outputOptions(['-c:v libx264', '-crf 18', '-c:a aac', '-map [outv]', '-map ' + (inputCount) + ':a:0', '-shortest']);
        } else {
            command.outputOptions(['-c:v libx264', '-crf 18', '-preset fast', '-map [outv]']);
            command.outputOptions(['-map 0:a?']);
        }

        command
          .on('progress', (progress) => {
            if (event) event.sender.send('process-progress', progress.percent);
          })
          .on('error', (err) => resolve({ success: false, error: err.message }))
          .on('end', () => resolve({ success: true, path: outputPath }))
          .save(outputPath);
    });
}

function processVideo(event, options) {
    return applyVideoFilters(options.inputPath, options.outputPath, options, event);
}

module.exports = { applyVideoFilters, processVideo };
