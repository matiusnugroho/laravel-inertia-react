<?php

namespace App\Support;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;

class WebpImage
{
    /**
     * Store an uploaded image as WebP on the public disk.
     */
    public static function storeFromUploadedFile(UploadedFile $file, string $directory, ?string $existingPath = null): string
    {
        return static::storeFromBinary($file->get(), $directory, $existingPath, static::detectExtension($file->getClientOriginalName()));
    }

    /**
     * Store an image read from disk as WebP on the public disk.
     */
    public static function storeFromPath(string $path, string $directory, ?string $existingPath = null): string
    {
        $contents = @file_get_contents($path);

        if ($contents === false) {
            throw new RuntimeException('Unable to read image for processing.');
        }

        return static::storeFromBinary($contents, $directory, $existingPath, static::detectExtension($path));
    }

    /**
     * Persist binary image data as WebP.
     */
    public static function storeFromBinary(string $binary, string $directory, ?string $existingPath = null, ?string $extension = null): string
    {
        $extension = $extension ? strtolower($extension) : null;

        if ($extension === 'webp') {
            return static::storeRawWebp($binary, $directory, $existingPath);
        }

        return static::encodeAndStoreWebp($binary, $directory, $existingPath);
    }

    /**
     * Attempt to extract the extension from a path or filename.
     */
    protected static function detectExtension(?string $path): ?string
    {
        if ($path === null || $path === '') {
            return null;
        }

        $extension = pathinfo($path, PATHINFO_EXTENSION);

        return $extension !== '' ? $extension : null;
    }

    /**
     * Store an existing WebP image without re-encoding it.
     */
    protected static function storeRawWebp(string $binary, string $directory, ?string $existingPath = null): string
    {
        static::ensureDirectoryExists($directory);

        $path = trim($directory, '/') . '/img_' . Str::orderedUuid() . '.webp';

        if (! Storage::disk('public')->put($path, $binary)) {
            throw new RuntimeException('Failed to store the WebP image.');
        }

        static::deleteExisting($existingPath);

        return $path;
    }

    /**
     * Encode arbitrary image data to WebP and store it.
     */
    protected static function encodeAndStoreWebp(string $binary, string $directory, ?string $existingPath = null): string
    {
        if (! function_exists('imagewebp')) {
            throw new RuntimeException('WebP encoding is not supported on the server.');
        }

        $resource = @imagecreatefromstring($binary);

        if ($resource === false) {
            throw new RuntimeException('The provided file is not a valid image.');
        }

        try {
            if (function_exists('imagepalettetotruecolor')) {
                @imagepalettetotruecolor($resource);
            }

            imagealphablending($resource, true);
            imagesavealpha($resource, true);

            ob_start();

            if (! imagewebp($resource, null, 80)) {
                ob_end_clean();

                throw new RuntimeException('Failed to encode the image as WebP.');
            }

            $webpData = ob_get_clean();

            if ($webpData === false) {
                throw new RuntimeException('Failed to retrieve the encoded WebP data.');
            }

            static::ensureDirectoryExists($directory);

            $path = trim($directory, '/') . '/' . Str::orderedUuid() . '.webp';

            if (! Storage::disk('public')->put($path, $webpData)) {
                throw new RuntimeException('Failed to store the encoded WebP image.');
            }

            static::deleteExisting($existingPath);

            return $path;
        } finally {
            imagedestroy($resource);
        }
    }

    /**
     * Ensure the target directory exists on the public disk.
     */
    protected static function ensureDirectoryExists(string $directory): void
    {
        $normalized = trim($directory, '/');

        if ($normalized === '') {
            return;
        }

        $disk = Storage::disk('public');

        if (! $disk->exists($normalized)) {
            $disk->makeDirectory($normalized);
        }
    }

    /**
     * Delete an existing image from the public disk if provided.
     */
    protected static function deleteExisting(?string $existingPath): void
    {
        if (! $existingPath) {
            return;
        }

        Storage::disk('public')->delete($existingPath);
    }
}
