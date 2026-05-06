import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { invalidDocumentPatch } from "./common/errors/document-errors";

async function bootstrap() {
	const app = await NestFactory.create(AppModule);
	app.enableCors();
	app.useGlobalPipes(
		new ValidationPipe({
			whitelist: true,
			transform: true,
			exceptionFactory: () => invalidDocumentPatch(),
		}),
	);
	await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
