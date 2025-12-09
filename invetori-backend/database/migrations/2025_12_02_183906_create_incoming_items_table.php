<?php

// database/migrations/xxxx_xx_xx_create_incoming_items_table.php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('incoming_items', function (Blueprint $table) {
            $table->id();
            $table->string('product_id')->index(); // Relasi ke ID barang
            $table->date('date');                  // Tanggal Masuk
            $table->integer('quantity');           // Jumlah
            $table->string('supplier')->nullable();// Supplier (Opsional)
            $table->text('notes')->nullable();     // Catatan
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('incoming_items');
    }
};