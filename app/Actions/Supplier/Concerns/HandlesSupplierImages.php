<?php

namespace App\Actions\Supplier\Concerns;

use App\Support\WebpImage;
use Illuminate\Http\UploadedFile;
use Illuminate\Validation\ValidationException;
use RuntimeException;

trait HandlesSupplierImages
{
    /**
     * Persist an uploaded image as WebP and return its storage path.
     *
     * @throws ValidationException
     */
    protected function persistImage(?UploadedFile $file, ?string $existingPath = null): ?string
    {
        if (! $file instanceof UploadedFile) {
            return $existingPath;
        }

        try {
            return WebpImage::storeFromUploadedFile($file, 'suppliers', $existingPath);
        } catch (RuntimeException $exception) {
            throw ValidationException::withMessages([
                'image' => $exception->getMessage(),
            ]);
        }
    }
}

