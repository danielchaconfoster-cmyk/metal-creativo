import os
import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls

def set_cell_background(cell, fill_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(f'<w:tcMar {nsdecls("w")}><w:top w:w="{top}" w:type="dxa"/><w:bottom w:w="{bottom}" w:type="dxa"/><w:left w:w="{left}" w:type="dxa"/><w:right w:w="{right}" w:type="dxa"/></w:tcMar>')
    tcPr.append(tcMar)

def init_doc():
    doc = Document()
    sec = doc.sections[0]
    sec.top_margin = Inches(0.8)
    sec.bottom_margin = Inches(0.8)
    sec.left_margin = Inches(0.8)
    sec.right_margin = Inches(0.8)
    return doc

def add_header(doc, title_text, subtitle_text=""):
    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run_t = p_title.add_run(title_text)
    run_t.font.name = 'Arial'
    run_t.font.size = Pt(18)
    run_t.font.bold = True
    run_t.font.color.rgb = RGBColor(200, 60, 0)
    p_title.paragraph_format.space_after = Pt(2)

    if subtitle_text:
        p_sub = doc.add_paragraph()
        p_sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
        run_s = p_sub.add_run(subtitle_text)
        run_s.font.name = 'Arial'
        run_s.font.size = Pt(10.5)
        run_s.font.color.rgb = RGBColor(100, 116, 139)
        p_sub.paragraph_format.space_after = Pt(14)

def add_heading1(doc, text):
    h = doc.add_paragraph()
    h.paragraph_format.space_before = Pt(14)
    h.paragraph_format.space_after = Pt(4)
    h.paragraph_format.keep_with_next = True
    run = h.add_run(text)
    run.font.name = 'Arial'
    run.font.size = Pt(12)
    run.font.bold = True
    run.font.color.rgb = RGBColor(15, 23, 42)
    return h

def add_heading2(doc, text):
    h = doc.add_paragraph()
    h.paragraph_format.space_before = Pt(10)
    h.paragraph_format.space_after = Pt(3)
    h.paragraph_format.keep_with_next = True
    run = h.add_run(text)
    run.font.name = 'Arial'
    run.font.size = Pt(10.5)
    run.font.bold = True
    run.font.color.rgb = RGBColor(200, 60, 0)
    return h

def add_p(doc, text, bold_prefix="", italic=False):
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(4)
    p.paragraph_format.line_spacing = 1.15
    if bold_prefix:
        r_pre = p.add_run(bold_prefix)
        r_pre.font.name = 'Arial'
        r_pre.font.size = Pt(9.5)
        r_pre.font.bold = True
        r_pre.font.color.rgb = RGBColor(15, 23, 42)
    r = p.add_run(text)
    r.font.name = 'Arial'
    r.font.size = Pt(9.5)
    r.font.italic = italic
    r.font.color.rgb = RGBColor(51, 65, 85)
    return p

def add_bullet(doc, text, bold_prefix=""):
    p = doc.add_paragraph(style='List Bullet')
    p.paragraph_format.space_after = Pt(3)
    p.paragraph_format.line_spacing = 1.15
    if bold_prefix:
        r_pre = p.add_run(bold_prefix)
        r_pre.font.name = 'Arial'
        r_pre.font.size = Pt(9.5)
        r_pre.font.bold = True
        r_pre.font.color.rgb = RGBColor(15, 23, 42)
    r = p.add_run(text)
    r.font.name = 'Arial'
    r.font.size = Pt(9.5)
    r.font.color.rgb = RGBColor(51, 65, 85)
    return p

def add_callout(doc, title, text, bg_hex="F8FAFC", border_color="C83C00"):
    table = doc.add_table(rows=1, cols=1)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False
    
    cell = table.cell(0, 0)
    cell.width = Inches(6.8)
    set_cell_background(cell, bg_hex)
    set_cell_margins(cell, top=120, bottom=120, left=160, right=160)
    
    tcPr = cell._tc.get_or_add_tcPr()
    borders = parse_xml(f'<w:tcBorders {nsdecls("w")}><w:left w:val="single" w:sz="24" w:space="0" w:color="{border_color}"/><w:top w:val="none"/><w:right w:val="none"/><w:bottom w:val="none"/></w:tcBorders>')
    tcPr.append(borders)
    
    p = cell.paragraphs[0]
    p.paragraph_format.space_after = Pt(2)
    r_tit = p.add_run(f"{title}\n")
    r_tit.font.name = 'Arial'
    r_tit.font.size = Pt(10)
    r_tit.font.bold = True
    r_tit.font.color.rgb = RGBColor(185, 28, 28) if border_color=="DC2626" else RGBColor(200, 60, 0)
    
    r_body = p.add_run(text)
    r_body.font.name = 'Arial'
    r_body.font.size = Pt(9)
    r_body.font.color.rgb = RGBColor(51, 65, 85)

    doc.add_paragraph().paragraph_format.space_after = Pt(2)

def add_styled_table(doc, headers, rows):
    table = doc.add_table(rows=len(rows) + 1, cols=len(headers))
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False
    
    # Header row
    hdr_cells = table.rows[0].cells
    for i, h_text in enumerate(headers):
        hdr_cells[i].text = h_text
        set_cell_background(hdr_cells[i], "0F172A") # Dark slate
        set_cell_margins(hdr_cells[i], top=100, bottom=100, left=120, right=120)
        p = hdr_cells[i].paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        for run in p.runs:
            run.font.name = 'Arial'
            run.font.size = Pt(9)
            run.font.bold = True
            run.font.color.rgb = RGBColor(255, 255, 255)
            
    # Rows
    for r_idx, row_data in enumerate(rows):
        row_cells = table.rows[r_idx + 1].cells
        bg_col = "F8FAFC" if r_idx % 2 == 0 else "FFFFFF"
        for c_idx, cell_value in enumerate(row_data):
            row_cells[c_idx].text = str(cell_value)
            set_cell_background(row_cells[c_idx], bg_col)
            set_cell_margins(row_cells[c_idx], top=80, bottom=80, left=120, right=120)
            p = row_cells[c_idx].paragraphs[0]
            for run in p.runs:
                run.font.name = 'Arial'
                run.font.size = Pt(8.5)
                run.font.color.rgb = RGBColor(30, 41, 59)
                
    doc.add_paragraph().paragraph_format.space_after = Pt(4)


# -------------------------------------------------------------
# 1. MANUAL DE USUARIO Y SEGURIDAD VIAL (DOCX)
# -------------------------------------------------------------
def build_manual_docx(output_path):
    doc = init_doc()
    add_header(doc, 
               "MANUAL OFICIAL DE USUARIO, OPERACIÓN Y SEGURIDAD VIAL", 
               "Barra Rígida de Remolque Desarmable 1.8m (Serie MC-1800R) · Metal Creativo Chile\nCumple Decreto Supremo N° 55/2025 MTT y Ley N° 18.290 de Tránsito")

    add_callout(doc, "ALERTA LEGAL: NORMATIVA VIGENTE EN CHILE (DESDE AGOSTO DE 2026)",
                "El Decreto Supremo N° 55/2025 del Ministerio de Transportes y Telecomunicaciones (MTT) prohíbe terminantemente el uso de lazos elásticos, cuerdas de nylon, piolas o cadenas para remolcar vehículos particulares en la vía pública. El remolque con elementos no rígidos constituye una Infracción Grave multada con 1 a 1.5 UTM ($70.000 a $100.000 CLP). Toda tracción debe efectuarse exclusivamente con barra metálica rígida homologada.",
                bg_hex="FEF2F2", border_color="DC2626")

    add_heading1(doc, "1. Especificaciones Técnicas Oficiales de Fábrica")
    headers = ["Parámetro Técnico", "Especificación Oficial Metal Creativo"]
    rows = [
        ["Fabricante y Origen", "Metal Creativo SpA · Fabricación 100% Chilena (Santiago)"],
        ["Material Estructural", "Acero al carbono ASTM A500 Grado B de alta tenacidad"],
        ["Espesor del Perfil", "3.0 mm de pared maciza reforzada contra torsión"],
        ["Largo Total Ensamblado", "1.80 metros (Distancia reglamentaria de seguridad)"],
        ["Modularidad", "3 tramos desmontables de 65 cm c/u (calce deslizante macho-hembra)"],
        ["Peso Total del Kit", "Aprox. 7.2 kg (Fácil manipulación y guardado en maletero)"],
        ["Capacidad de Arrastre", "3.500 kg (3.5 Toneladas) en tracción directa horizontal"],
        ["Factor de Seguridad", "Rotura estática superior a 6.000 kg (Factor 2:1)"],
        ["Pasadores de Seguridad", "2 pasadores de 1/2\" cincados con chaveta elástica tipo R"],
        ["Elementos de Conexión", "2 grilletes forjados tipo lira de 1/2\" galvanizados"],
        ["Señalización Reflectante", "Huincha reflectante microprismática roja/blanca grado DOT-C2"],
        ["Garantía de Fábrica", "6 Meses de garantía legal directa (Ley 19.496 SERNAC)"]
    ]
    add_styled_table(doc, headers, rows)

    add_heading1(doc, "2. Componentes del Kit (Despiece)")
    add_bullet(doc, "Tubo de acero con ojal forjado soldado hacia el vehículo tractor y espiga macho de inserción.", "1. Tramo Frontal (65 cm): ")
    add_bullet(doc, "Tubo matriz con doble boca hembra receptora y cinta reflectante reglamentaria de alta intensidad.", "2. Tramo Central (65 cm): ")
    add_bullet(doc, "Espiga macho receptora + ojal forjado de tiro hacia el vehículo averiado.", "3. Tramo Trasero (65 cm): ")
    add_bullet(doc, "Atraviesan rígidamente las uniones macho-hembra impidiendo desacoples axiales.", "4. Dos (2) Pasadores de 1/2\": ")
    add_bullet(doc, "Seguros de alambre acerado que garantizan que el pasador nunca se salga en ruta.", "5. Dos (2) Chavetas Elásticas Tipo R: ")
    add_bullet(doc, "Con perno roscado para enlace rápido a los ganchos de chasis de cada automóvil.", "6. Dos (2) Grilletes Forjados de 1/2\": ")

    add_heading1(doc, "3. Procedimiento de Montaje y Ensamble (Paso a Paso en 60 Segundos)")
    add_p(doc, "Ubique los 3 tramos sobre una superficie firme fuera de la calzada de tránsito rápido con su chaleco reflectante puesto.", "Paso 1 (Posicionamiento): ")
    add_p(doc, "Deslice las espigas macho del tramo frontal y trasero dentro de las bocas del tramo central hasta que los orificios coincidan a 90°.", "Paso 2 (Inserción): ")
    add_p(doc, "Introduzca el pasador macizo atravesando completamente ambas caras de cada unión.", "Paso 3 (Pasadores): ")
    add_p(doc, "Inserte la chaveta elástica tipo R en el orificio exterior de cada pasador hasta escuchar el clic metálico. NUNCA inicie la marcha sin ambas chavetas colocadas.", "Paso 4 (Bloqueo de Seguridad): ")

    add_heading1(doc, "4. Protocolo de Acople a los Vehículos y Regla del Grillete")
    add_p(doc, "Alinee ambos vehículos en línea recta con 1.70m a 1.80m de distancia. Apague motores y active frenos de mano.")
    add_p(doc, "Conecte los grilletes ÚNICAMENTE a los ganchos de tiro estructurales originales del chasis o cáncamo roscable del kit de repuesto. NUNCA enganche a parachoques plásticos, bandejas de suspensión, cremallera de dirección ni barra estabilizadora.")
    add_callout(doc, "REGLA DE ORO DE SEGURIDAD DEL GRILLETE TIPO LIRA",
                "Al colocar el perno roscado del grillete, apriételo a tope con la mano. Una vez apretado, GÍRELO 1/4 DE VUELTA HACIA ATRÁS (sentido antihorario). Esto evita que la tracción del remolque gripe o bloquee la rosca, permitiendo retirarlo fácilmente sin herramientas al finalizar.",
                bg_hex="F0FDF4", border_color="16A34A")

    add_heading1(doc, "5. Checklist Vital Antes de Poner en Marcha")
    add_bullet(doc, "En el vehículo remolcado, ponga la llave en posición 'ON' o Accesorios y mueva el volante para confirmar giro libre. ¡ADVERTENCIA: Si no se desbloquea, el volante se trabará en la primera curva provocando un accidente!", "1. DESBLOQUEO DEL VOLANTE (VITAL): ")
    add_bullet(doc, "Confirmar visualmente que el freno de estacionamiento esté abajo en el auto remolcado.", "2. FRENO DE MANO LIBERADO: ")
    add_bullet(doc, "Punto muerto en caja mecánica; posición 'N' en caja automática.", "3. CAJA EN NEUTRO: ")
    add_bullet(doc, "Intermitentes / hazard activos en ambos automóviles durante todo el recorrido.", "4. LUCES DE ADVERTENCIA: ")
    add_bullet(doc, "Solo debe ir el conductor al volante. Niños y acompañantes deben viajar en el vehículo tractor.", "5. CONDUCTOR HABILITADO AL VOLANTE: ")

    add_heading1(doc, "6. Técnicas de Conducción en Ruta")
    add_bullet(doc, "Con el motor apagado no funciona el servofreno ni la bomba hidráulica. El pedal de freno estará duro y requiere pisar con mucha fuerza muscular. Sujete firmemente el volante con ambas manos.", "Frenos y Dirección Rígidos: ")
    add_bullet(doc, "Máximo 30 km/h en zona urbana y 40 km/h en autopistas según Decreto MTT 55/2025.", "Límites de Velocidad Legales: ")
    add_bullet(doc, "El conductor tractor debe iniciar la marcha soltando el embrague lentamente en primera marcha. Cero acelerones bruscos.", "Arranque Progresivo: ")
    add_bullet(doc, "Abra el radio al girar en esquinas para que el auto remolcado no monte soleras.", "Curvas Amplias: ")

    add_heading1(doc, "7. Mantenimiento y Garantía Legal")
    add_p(doc, "Garantía de 6 Meses conforme a la Ley N° 19.496 del SERNAC sobre cordones de soldadura y estructura de acero. Limpie con agua dulce tras uso en lluvia o barro y aplique spray lubricante en pasadores.")
    add_p(doc, "Contacto Técnico Metal Creativo SpA · WhatsApp: +56 9 5492 2608 · Web: www.metalcreativo.cl", italic=True)

    doc.save(output_path)
    print(f"Manual DOCX saved to {output_path}")


# -------------------------------------------------------------
# 2. PLAYBOOK DE VENTAS WHATSAPP (DOCX)
# -------------------------------------------------------------
def build_playbook_docx(output_path):
    doc = init_doc()
    add_header(doc, 
               "PLAYBOOK DE VENTAS Y CIERRE POR WHATSAPP (LEADS META ADS)", 
               "Metal Creativo Chile · Barra Rígida de Remolque ($65.000 CLP)\nGuía Práctica de Conversión, Manejo de Objeciones y Scripts Copy-Paste")

    add_callout(doc, "REGLA DE LOS 120 SEGUNDOS",
                "Responder un lead de Meta Ads en menos de 2 minutos multiplica por 7 la probabilidad de cierre. Si demoras más de 30 minutos, la tasa de conversión cae un 80% porque el prospecto siguió scrolleando en redes o cotizó a otro anuncio.",
                bg_hex="FFFBEB", border_color="D97706")

    add_heading1(doc, "1. Perfiles de Clientes que Vienen de Meta Ads")
    add_bullet(doc, "Viaja en familia al sur o vacaciones. Busca tranquilidad mental para no quedar botado.", "1. Conductor Preventivo / Familiar: ")
    add_bullet(doc, "Vio que el Decreto MTT 55/2025 multa el lazo flexible con hasta $100.000 CLP. Busca evitar sanciones.", "2. Afectado por la Ley / Miedo a la Multa: ")
    add_bullet(doc, "Tira camionetas, jeeps o furgones. Quiere acero de 3mm que resista 3.500 kg sin doblarse.", "3. Mecánico / Usuario 4x4 / Faena: ")

    add_heading1(doc, "2. Flujo de Conversación en 4 Pasos (Scripts Copy-Paste)")
    
    add_heading2(doc, "Paso 1: Saludo Rápido y Pregunta Filtro")
    add_callout(doc, "SCRIPT DE SALUDO (Copiar y Guardar en WhatsApp Business)",
                "¡Hola! 👋 Qué tal, te atiende [Tu Nombre] de Metal Creativo Chile.\nNuestra Barra Rígida Desarmable es la homologada bajo la nueva normativa del MTT para evitar multas de Carabineros y choques por alcance.\n\nCuéntame rápido: ¿Para qué auto o camioneta la necesitas y a qué comuna o ciudad sería el despacho? Así te confirmo compatibilidad al tiro.",
                bg_hex="F8FAFC", border_color="0F172A")

    add_heading2(doc, "Paso 2: Diagnóstico y Presentación de la Oferta")
    add_callout(doc, "SCRIPT DE OFERTA",
                "¡Excelente vehículo! Para ese modelo queda impecable. La barra soporta hasta 3.500 kg de arrastre directo.\n\n⚙️ Puntos clave:\n1. Desarmable en 3 tramos de 65 cm: Cabe junto a la rueda de repuesto en tu maletero.\n2. Tubo de acero estructural de 3 mm: Macizo, no se dobla con los tirones e incluye pasadores con seguro.\n3. 100% Legal Decreto MTT 55/2025: Distancia fija de 1.8 metros para que no choques si el auto de adelante frena.\n\n💰 Valor de Taller: $65.000 CLP (IVA incluido) con grilletes y pasadores listos para usar.",
                bg_hex="F8FAFC", border_color="C83C00")

    add_heading2(doc, "Paso 3: Cierre por Doble Alternativa (No preguntes si le interesa)")
    add_callout(doc, "SCRIPT DE CIERRE",
                "Como tenemos despachos diarios por Starken y Chilexpress, te la puedo dejar embalada hoy mismo.\n\n¿Te acomoda pagar mediante Transferencia Bancaria Directa o prefieres link de Webpay / Mercado Pago para pagar con tarjeta en cuotas?",
                bg_hex="F0FDF4", border_color="16A34A")

    add_heading1(doc, "3. Matriz de Manejo de Objeciones")
    
    add_p(doc, "Respuesta: 'Te entiendo, pero ojo con dos cosas: 1) Carabineros ya fiscaliza bajo el Decreto MTT 55 con multas de 1 a 1.5 UTM ($70.000 a $100.000 CLP). La multa te sale más cara que la barra. 2) La cuerda no frena: si el auto tractor frena de golpe, te estrellas contra su maleta. La barra mantiene 1.8m fijos y frena parejo. Es una inversión de seguridad para toda la vida.'",
          bold_prefix="Objeción 1: 'En la feria o internet venden cuerdas por $10.000': ")

    add_p(doc, "Respuesta: 'Totalmente. Viene con grilletes forjados tipo lira de acople universal. Se engancha directo al cáncamo original de fábrica de tu auto o al gancho del chasis. No tienes que soldar ni adaptar nada.'",
          bold_prefix="Objeción 2: '¿Le servirá a mi modelo de auto?': ")

    add_p(doc, "Respuesta: 'La fabricamos en tubo de acero de 3 mm real (no es lata delgada china). Soporta 3.500 kg probados, desde autos chicos hasta Hilux o Navara cargadas. Además te entregamos 6 meses de garantía directa de taller.'",
          bold_prefix="Objeción 3: '¿Aguanta de verdad o se dobla?': ")

    add_p(doc, "Respuesta: 'Como se desarma en 3 tramos de 65 cm, el paquete queda súper compacto (7 kg). El flete por Starken o Chilexpress sale aprox entre $4.500 y $7.500 a la mayoría de las comunas. Se envía por pagar para que pagues la tarifa real.'",
          bold_prefix="Objeción 4: '¿El envío a regiones es muy caro?': ")

    add_heading1(doc, "4. Secuencia de Seguimiento para 'Dejados en Visto'")
    add_bullet(doc, "'¡Hola [Nombre]! Te dejé la info arriba. Justo estamos preparando la tanda de despachos de hoy por Starken. ¿Pudiste revisar si te acomodaba transferencia o tarjeta para guardarte una barra de este lote?'", "A las 3 Horas: ")
    add_bullet(doc, "'Hola [Nombre], buen día. Como fabricamos en tandas en el taller, nos van quedando las últimas 3 barras de esta semana con despacho inmediato. ¿Te aparto una a tu nombre?'", "A las 24 Horas: ")
    add_bullet(doc, "'Hola [Nombre]! Te paso el dato: Carabineros está fiscalizando fuerte la ley de remolque con multas de 1 a 1.5 UTM. Si quieres salir a carretera 100% blindado, avísame y coordinamos la entrega hoy. ¡Un abrazo!'", "A los 3 Días: ")

    doc.save(output_path)
    print(f"Playbook DOCX saved to {output_path}")


# -------------------------------------------------------------
# 3. CUESTIONARIO TALLER NACHO (DOCX)
# -------------------------------------------------------------
def build_cuestionario_docx(output_path):
    doc = init_doc()
    add_header(doc, 
               "FICHA TÉCNICA Y CUESTIONARIO DE TALLER", 
               "Validación de Parámetros de Fabricación · Metal Creativo Chile\nBarra Rígida de Remolque Desarmable")

    add_p(doc, "Este cuestionario está diseñado para que el equipo de taller o Nacho valide y confirme las medidas exactas de producción. Los valores por defecto recomendados ya están cargados:")

    headers = ["Componente / Variable", "Valor por Defecto Recomendado", "Validación Taller / Ajuste"]
    rows = [
        ["Largo Total Armada", "1.80 metros (Reglamentario MTT)", "[  ] Confirmado  /  Otro: _______"],
        ["Largo Tramos Desarmados", "3 piezas de 65 cm c/u", "[  ] Confirmado  /  Otro: _______"],
        ["Peso Total del Kit", "7.0 kg a 7.5 kg aprox.", "[  ] Confirmado  /  Otro: _______"],
        ["Perfilería Tubo", "Acero al carbono 3 mm espesor", "[  ] Confirmado  /  Otro: _______"],
        ["Pasadores de Bloqueo", "Pernos cincados de 1/2\" con chaveta R", "[  ] Confirmado  /  Otro: _______"],
        ["Grilletes de Tiro", "Grilletes galvanizados lira 1/2\"", "[  ] Confirmado  /  Otro: _______"],
        ["Capacidad de Arrastre", "Hasta 3.500 kg (3.5 Toneladas)", "[  ] Confirmado  /  Otro: _______"],
        ["Pintura y Acabado", "Esmalte anticorrosivo negro mate", "[  ] Confirmado  /  Otro: _______"],
        ["Huincha Reflectante", "Grado DOT-C2 roja/blanca reglamentaria", "[  ] Confirmado  /  Otro: _______"],
        ["Garantía Fábrica", "6 Meses de garantía legal SERNAC", "[  ] Confirmado  /  Otro: _______"]
    ]
    add_styled_table(doc, headers, rows)

    add_heading1(doc, "Mensaje Breve para Enviar por WhatsApp a Nacho:")
    add_callout(doc, "COPIAR Y PEGAR EN EL CHAT",
                "¡Hola Nacho! Te armé el cuestionario ultra rápido para que no pierdas tiempo. Casi todo ya está pre-llenado con los datos estándar de la barra de 1.8m y 3 tramos. Porfa solo confírmame si están OK o corrígeme algún número:\n\n1. ¿Largo 1.80m armada y tramos de 65cm?\n2. ¿Pesa aprox 7 kg?\n3. ¿Pasadores de 1/2\" con seguro tipo R?\n4. ¿Incluye los 2 grilletes lira de 1/2\"?\n5. ¿Aguante 3.500 kg y garantía de 6 meses?\n\nCon que me des el visto bueno de estos 5 puntos, el manual técnico queda 100% blindado para imprimir o mandar a los clientes en PDF. ¡Un abrazo!",
                bg_hex="F8FAFC", border_color="C83C00")

    doc.save(output_path)
    print(f"Cuestionario DOCX saved to {output_path}")

if __name__ == "__main__":
    base_dir = r"c:\Users\usuario\Desktop\Nacho proyecto"
    build_manual_docx(os.path.join(base_dir, "Manual_Tecnico_Lanza_Metal_Creativo.docx"))
    build_playbook_docx(os.path.join(base_dir, "Playbook_Ventas_WhatsApp_Meta_Ads.docx"))
    build_cuestionario_docx(os.path.join(base_dir, "Cuestionario_Taller_Nacho.docx"))
    print("All DOCX documents built successfully!")
