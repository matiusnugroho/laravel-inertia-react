<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class Supplier extends Model
{
    use HasFactory;

    /**
     * Indicates if the IDs are auto-incrementing.
     */
    public $incrementing = false;

    /**
     * The data type of the primary key ID.
     */
    protected $keyType = 'string';

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'id' => 'string',
    ];

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'contact_name',
        'email',
        'phone',
        'address',
        'image_path',
    ];

    /**
     * Boot the model.
     */
    protected static function booted(): void
    {
        static::creating(function (self $supplier): void {
            if (! $supplier->getKey()) {
                $supplier->{$supplier->getKeyName()} = (string) Str::orderedUuid();
            }
        });

        static::deleting(function (self $supplier): void {
            if ($supplier->image_path) {
                Storage::disk('public')->delete($supplier->image_path);
            }
        });
    }

    /**
     * Get the products that belong to the supplier.
     */
    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
    }
}
