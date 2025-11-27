async function validarDispositivo(user) {
    const email = user.email;
    currentUserEmail = email;
    const miDeviceId = obtenerDeviceId();
    // Determina el límite: 2 para correos específicos, 1 para el resto
    let limite = correosDosDispositivos.includes(email) ? 2 : 1;
    const docRef = doc(db, "usuarios_seguros", email);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        const datos = docSnap.data();
        let lista = datos.dispositivos || [];
        
        if (lista.includes(miDeviceId)) {
            return true; // Dispositivo actual ya registrado
        } else {
            if (lista.length < limite) {
                // Hay espacio para agregar el nuevo dispositivo
                lista.push(miDeviceId);
                await setDoc(docRef, { dispositivos: lista }, { merge: true });
                return true;
            } else {
                // Límite alcanzado, intentar reemplazo silencioso
                if (limite > 0) {
                    const oldDeviceId = lista.shift(); // Elimina el más antiguo (FIFO)
                    lista.push(miDeviceId); // Agrega el nuevo
                    await setDoc(docRef, { dispositivos: lista }, { merge: true });
                    // *** CAMBIO CLAVE: Se eliminó la línea de 'alert' ***
                    return true;
                }
                
                // Si por alguna razón límite es 0 (no debería pasar) o falla
                alert(`⛔ ACCESO DENEGADO ⛔\nLímite de ${limite} dispositivos alcanzado.`);
                await signOut(auth);
                location.reload();
                return false;
            }
        }
    } else {
        // Primer inicio de sesión del usuario
        await setDoc(docRef, { dispositivos: [miDeviceId], fecha: new Date().toISOString() });
        return true;
    }
}
