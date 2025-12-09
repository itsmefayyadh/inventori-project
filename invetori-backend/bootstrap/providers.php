<?php

return [
    App\Providers\AppServiceProvider::class,
    // Tambahkan baris di bawah ini:
    MongoDB\Laravel\MongoDBServiceProvider::class,
];