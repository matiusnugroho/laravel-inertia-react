<?php

namespace App\Actions\Product\Concerns;

use App\Support\WebpImage;
use Illuminate\Http\UploadedFile;
use Illuminate\Validation\ValidationException;
use RuntimeException;

trait HandlesProductImages
{
    /**
     * Persist an uploaded image as WebP and return its path.
     *
     * @throws ValidationException
     */
    protected function persistImage(?UploadedFile $file, ?string $existingPath = null): ?string
    {
        if (! $file instanceof UploadedFile) {
            return $existingPath;
        }

        try {
            return WebpImage::storeFromUploadedFile($file, 'products', $existingPath);
        } catch (RuntimeException $exception) {
            throw ValidationException::withMessages([
                'image' => $exception->getMessage(),
            ]);
        }
    }
}

