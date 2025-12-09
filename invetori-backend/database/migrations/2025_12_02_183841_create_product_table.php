<?php

// database/migrations/xxxx_xx_xx_create_products_table.php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique(); // Kode Barang (Unik)
            $table->string('name');           // Nama Barang
            $table->string('category');       // Kategori
            $table->integer('stock')->default(0); // Stok Awal
            $table->string('unit');           // Satuan (pcs, kg, dll)
            $table->double('purchase_price'); // Harga Beli
            $table->double('selling_price');  // Harga Jual
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};