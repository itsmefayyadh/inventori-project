<?php

// database/migrations/xxxx_xx_xx_create_outgoing_items_table.php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('outgoing_items', function (Blueprint $table) {
            $table->id();
            $table->string('product_id')->index();  // Relasi ke ID barang
            $table->date('date');                   // Tanggal Keluar
            $table->integer('quantity');            // Jumlah
            $table->string('recipient')->nullable();// Penerima/Customer
            $table->text('notes')->nullable();      // Catatan
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('outgoing_items');
    }
};